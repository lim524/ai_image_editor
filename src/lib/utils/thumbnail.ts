export async function createThumbnail(
  blob: Blob,
  maxSize = 200
): Promise<{ thumbnail: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  const origW = bitmap.width;
  const origH = bitmap.height;
  const scale = Math.min(maxSize / origW, maxSize / origH, 1);
  const width = Math.round(origW * scale);
  const height = Math.round(origH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const thumbnail = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Thumbnail failed"))),
      "image/webp",
      0.8
    );
  });

  return { thumbnail, width: origW, height: origH };
}

export async function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  bitmap.close();
  return { width, height };
}
