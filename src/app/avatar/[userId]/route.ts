import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true, profile: { select: { imageUrl: true } } },
  });
  const source = user?.profile?.imageUrl ?? user?.image;
  if (!source) return new NextResponse(null, { status: 404 });

  // A versioned URL (?v=updatedAt) never changes content, so cache it forever.
  const versioned = req.nextUrl.searchParams.has("v");
  const cacheControl = versioned
    ? "public, max-age=31536000, immutable"
    : "public, max-age=300";

  const data = DATA_URL.exec(source);
  if (data) {
    return new NextResponse(Buffer.from(data[2], "base64"), {
      headers: {
        "Content-Type": data[1],
        "Cache-Control": cacheControl,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  if (/^https:\/\//.test(source)) {
    return NextResponse.redirect(source, {
      status: 302,
      headers: { "Cache-Control": versioned ? "public, max-age=86400" : "public, max-age=300" },
    });
  }
  return new NextResponse(null, { status: 404 });
}
