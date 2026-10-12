import { prisma } from "@/lib/db";
import { resolveImage } from "@/lib/storage";
import { imageResponse } from "@/lib/serve-image";

// Event photos are club moments shown on the public home page too, so this is
// public. A photo is never edited once uploaded: cache it for a year.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await prisma.eventPhoto.findUnique({ where: { id }, select: { imageUrl: true } });
  return imageResponse(await resolveImage(photo?.imageUrl), "public, max-age=31536000, immutable");
}
