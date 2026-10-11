import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decodeImageDataUrl } from "@/lib/data-url";

// Transfer proofs are private: only the member who owes the fee and admins
// may see them, so this checks the session on every request and never lets
// shared caches keep a copy.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dueId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const { dueId } = await params;
  const due = await prisma.feeDue.findUnique({
    where: { id: dueId },
    select: { userId: true, proofUrl: true },
  });
  const allowed =
    due && (due.userId === session.user.id || session.user.role === "ADMIN");
  if (!allowed || !due.proofUrl) return new NextResponse(null, { status: 404 });

  const cacheControl = req.nextUrl.searchParams.has("v")
    ? "private, max-age=86400"
    : "private, no-cache";

  const data = decodeImageDataUrl(due.proofUrl);
  if (data) {
    return new NextResponse(data.bytes, {
      headers: {
        "Content-Type": data.contentType,
        "Cache-Control": cacheControl,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  // Proofs submitted as links before uploads existed.
  if (/^https:\/\//.test(due.proofUrl)) {
    return NextResponse.redirect(due.proofUrl, { headers: { "Cache-Control": cacheControl } });
  }
  return new NextResponse(null, { status: 404 });
}
