import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp, { type Sharp } from "sharp";
import { ActionError } from "@/lib/action-error";
import { decodeImageDataUrl } from "@/lib/data-url";

// Uploaded images. With the SPACES_* variables set (production) they go to
// DigitalOcean Spaces and the database keeps "spaces:<key>"; without them
// (local dev) the processed image stays in the database as a data URL. The
// /avatar, /proof and /event-photo routes serve both, plus older https links.
//
//   avatar   public, square 512 px WebP
//   proof    private (signed links only), max 1600 px WebP, readable text
//   gallery  public, max 1920 px JPEG (mozjpeg), smallest size for the album

export type ImageKind = "avatar" | "proof" | "gallery";

const PROCESS: Record<ImageKind, (img: Sharp) => Sharp> = {
  avatar: (img) => img.resize(512, 512, { fit: "cover" }).webp({ quality: 80 }),
  proof: (img) => img.resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }),
  gallery: (img) =>
    img.resize(1920, 1920, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 74, mozjpeg: true, progressive: true }),
};
const FORMAT: Record<ImageKind, { ext: string; type: string; folder: string; isPublic: boolean }> = {
  avatar: { ext: "webp", type: "image/webp", folder: "avatars", isPublic: true },
  proof: { ext: "webp", type: "image/webp", folder: "proofs", isPublic: false },
  gallery: { ext: "jpg", type: "image/jpeg", folder: "gallery", isPublic: true },
};

const PREFIX = "spaces:";

function spaces() {
  const { SPACES_KEY, SPACES_SECRET, SPACES_BUCKET, SPACES_REGION } = process.env;
  if (!SPACES_KEY || !SPACES_SECRET || !SPACES_BUCKET || !SPACES_REGION) return null;
  return {
    bucket: SPACES_BUCKET,
    folder: (process.env.SPACES_PREFIX ?? "pb-wisdom").replace(/^\/+|\/+$/g, ""),
    publicBase: (process.env.SPACES_CDN_URL || `https://${SPACES_BUCKET}.${SPACES_REGION}.digitaloceanspaces.com`).replace(/\/+$/, ""),
    client: (client ??= new S3Client({
      endpoint: process.env.SPACES_ENDPOINT || `https://${SPACES_REGION}.digitaloceanspaces.com`,
      // Spaces ignores the signing region; the SDK just needs one.
      region: "us-east-1",
      credentials: { accessKeyId: SPACES_KEY, secretAccessKey: SPACES_SECRET },
    })),
  };
}
let client: S3Client | undefined;

/** Re-encode an uploaded image (data URL) for its kind and store it. Returns what goes in the database. */
export async function storeImage(kind: ImageKind, dataUrl: string): Promise<string> {
  const decoded = decodeImageDataUrl(dataUrl);
  if (!decoded) throw new ActionError("Format foto tidak valid");

  let bytes: Buffer;
  try {
    // rotate() applies the EXIF orientation; metadata (GPS etc.) is dropped.
    bytes = await PROCESS[kind](sharp(decoded.bytes, { failOn: "error", limitInputPixels: 50_000_000 }).rotate()).toBuffer();
  } catch {
    throw new ActionError("Foto tidak bisa dibaca, coba foto lain");
  }

  const f = FORMAT[kind];
  const s = spaces();
  if (!s) return `data:${f.type};base64,${bytes.toString("base64")}`;

  const key = `${s.folder}/${f.folder}/${randomUUID()}.${f.ext}`;
  await s.client.send(
    new PutObjectCommand({
      Bucket: s.bucket,
      Key: key,
      Body: bytes,
      ContentType: f.type,
      ACL: f.isPublic ? "public-read" : "private",
      // Keys are never reused, so the object can be cached forever.
      CacheControl: f.isPublic ? "public, max-age=31536000, immutable" : "private, max-age=86400",
    }),
  );
  return `${PREFIX}${key}`;
}

export type ResolvedImage = { redirect: string } | { bytes: Buffer; contentType: string } | null;

/** Where to get a stored image: a CDN or signed URL to redirect to, or bytes kept in the database. */
export async function resolveImage(stored: string | null | undefined): Promise<ResolvedImage> {
  if (!stored) return null;
  if (stored.startsWith(PREFIX)) {
    const s = spaces();
    if (!s) return null;
    const key = stored.slice(PREFIX.length);
    if (key.includes(`/${FORMAT.proof.folder}/`)) {
      // Private: a link valid for 5 minutes, only handed out after the route's access check.
      return { redirect: await getSignedUrl(s.client, new GetObjectCommand({ Bucket: s.bucket, Key: key }), { expiresIn: 300 }) };
    }
    return { redirect: `${s.publicBase}/${key}` };
  }
  const data = decodeImageDataUrl(stored);
  if (data) return data;
  // Links saved before uploads existed (e.g. Google profile photos).
  if (/^https:\/\//.test(stored)) return { redirect: stored };
  return null;
}

/**
 * Delete images from Spaces once the response is sent (call it after the
 * database change succeeded). Values kept in the database need nothing.
 */
export function deleteStoredImages(values: (string | null | undefined)[]) {
  const keys = values.filter((v): v is string => !!v?.startsWith(PREFIX)).map((v) => v.slice(PREFIX.length));
  const s = spaces();
  if (!keys.length || !s) return;
  after(async () => {
    try {
      await s.client.send(new DeleteObjectsCommand({ Bucket: s.bucket, Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true } }));
    } catch (err) {
      console.error("[storage] delete failed", keys, err);
    }
  });
}
