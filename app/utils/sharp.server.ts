import sharp from "sharp";

export async function convertToWebp(
  path: ArrayBuffer | string | Buffer,
  width?: number,
  height?: number
) {
  return sharp(path).resize(width, height).webp({ quality: 80 });
}
