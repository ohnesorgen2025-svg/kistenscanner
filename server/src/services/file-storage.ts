import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const imagesDirectory = path.resolve(process.cwd(), "data", "images");

function buildTimestampFileName(prefix: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
}

export async function saveItemImageBuffer(buffer: Buffer): Promise<string> {
  const itemImagesDirectory = path.join(imagesDirectory, "item-images");
  await mkdir(itemImagesDirectory, { recursive: true });

  const fileName = buildTimestampFileName("item");
  const absolutePath = path.join(itemImagesDirectory, fileName);
  const normalizedBuffer = await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();

  await writeFile(absolutePath, normalizedBuffer);

  return `/images/item-images/${fileName}`;
}
