// Browser-only. Downscales a photo and re-encodes it until the data URL fits
// in `maxChars`, so phone photos (often 3-8 MB) upload as ~100-400 KB.
export async function shrinkImageFile(file: File, maxChars: number): Promise<string> {
  const image = await loadImage(file);
  for (const maxSide of [1600, 1280, 1024, 800]) {
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.7, 0.6]) {
      // Browsers that cannot encode WebP silently return PNG; use JPEG then.
      let url = canvas.toDataURL("image/webp", quality);
      if (!url.startsWith("data:image/webp")) url = canvas.toDataURL("image/jpeg", quality);
      if (url.length <= maxChars) return url;
    }
  }
  throw new Error("Foto terlalu besar, coba foto lain");
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("File ini bukan gambar yang bisa dibaca"));
    };
    img.src = url;
  });
}
