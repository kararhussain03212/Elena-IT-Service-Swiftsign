export async function convertImageFileToWebp(file, quality = 0.82) {
  if (!(file instanceof File)) return null;

  const mime = String(file.type || "").toLowerCase();
  if (mime === "image/webp") return file;
  if (!["image/jpeg", "image/jpg", "image/png"].includes(mime)) return file;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas 2D context unavailable");
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) {
    throw new Error("Browser failed to encode WebP");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}
