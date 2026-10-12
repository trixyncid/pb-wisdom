import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveImage } from "@/lib/storage";
import { imageResponse } from "@/lib/serve-image";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true, profile: { select: { imageUrl: true } } },
  });
  // A versioned URL (?v=updatedAt) never changes content, so cache it forever.
  const versioned = req.nextUrl.searchParams.has("v");
  return imageResponse(
    await resolveImage(user?.profile?.imageUrl ?? user?.image),
    versioned ? "public, max-age=31536000, immutable" : "public, max-age=300",
  );
}
