import sharp from "sharp";

export async function convertToWebp(
  path: ArrayBuffer | string | Buffer,
  width?: number,
  height?: number
) {
  return sharp(path).resize(width, height).webp({ quality: 80 });
}

export async function convertToPNG(
  path: ArrayBuffer | string | Buffer,
  width?: number,
  height?: number
) {
  return sharp(path).resize(width, height).png({ quality: 80 });
}

export async function convertSwitch(
  type: "webp" | "png",
  path: ArrayBuffer | string | Buffer,
  width?: number,
  height?: number
) {
  switch (type) {
    case "webp":
      return convertToWebp(path, width, height);
    case "png":
      return convertToPNG(path, width, height);
    default:
      return convertToWebp(path, width, height);
  }
}
