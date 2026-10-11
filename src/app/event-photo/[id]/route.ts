import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decodeImageDataUrl } from "@/lib/data-url";

// Event photos are club moments shown on the public home page too, so this is
// public. A photo is never edited once uploaded: cache it for a year.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await prisma.eventPhoto.findUnique({ where: { id }, select: { imageUrl: true } });
  if (!photo) return new NextResponse(null, { status: 404 });

  const data = decodeImageDataUrl(photo.imageUrl);
  if (data) {
    return new NextResponse(data.bytes, {
      headers: {
        "Content-Type": data.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  // Photos added as links before uploads existed.
  if (/^https:\/\//.test(photo.imageUrl)) {
    return NextResponse.redirect(photo.imageUrl, { headers: { "Cache-Control": "public, max-age=86400" } });
  }
  return new NextResponse(null, { status: 404 });
}
