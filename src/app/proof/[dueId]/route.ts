import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveImage } from "@/lib/storage";
import { imageResponse } from "@/lib/serve-image";

// Transfer proofs are private: only the member who owes the fee and admins
// may see them, so this checks the session on every request and never lets
// shared caches keep a copy. In Spaces they are private objects; this hands
// out a signed link valid for a few minutes.
export async function GET(req: NextRequest, { params }: { params: Promise<{ dueId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const { dueId } = await params;
  const due = await prisma.feeDue.findUnique({
    where: { id: dueId },
    select: { userId: true, proofUrl: true },
  });
  const allowed = due && (due.userId === session.user.id || session.user.role === "ADMIN");
  if (!allowed || !due.proofUrl) return new NextResponse(null, { status: 404 });

  const image = await resolveImage(due.proofUrl);
  // Signed links expire, so a redirect must not be reused from cache.
  const cacheControl =
    image && "redirect" in image ? "private, no-store" : req.nextUrl.searchParams.has("v") ? "private, max-age=86400" : "private, no-cache";
  return imageResponse(image, cacheControl);
}
