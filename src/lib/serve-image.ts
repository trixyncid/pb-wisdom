import { NextResponse } from "next/server";
import type { ResolvedImage } from "@/lib/storage";

/** Response for a stored image: redirect to Spaces / an old link, or the bytes themselves. */
export function imageResponse(image: ResolvedImage, cacheControl: string) {
  if (!image) return new NextResponse(null, { status: 404 });
  if ("redirect" in image) {
    return NextResponse.redirect(image.redirect, { status: 302, headers: { "Cache-Control": cacheControl } });
  }
  return new NextResponse(new Uint8Array(image.bytes), {
    headers: { "Content-Type": image.contentType, "Cache-Control": cacheControl, "X-Content-Type-Options": "nosniff" },
  });
}
