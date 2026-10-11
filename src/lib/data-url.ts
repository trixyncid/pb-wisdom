const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

/** Decodes an image data URL into bytes, or null if it is not one. */
export function decodeImageDataUrl(value: string) {
  const m = DATA_URL.exec(value);
  return m ? { contentType: m[1], bytes: Buffer.from(m[2], "base64") } : null;
}
