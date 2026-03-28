import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { Router } from "express";
import multer from "multer";
import sharp from "sharp";

import { analyzeImages } from "../lib/ai/analyze-images.js";
import {
  type AnalysisItem,
  type AnalysisItemBoundingBox,
  parseAnalysis,
} from "../lib/ai/parse-analysis.js";
import { BOX_ANALYSIS_PROMPT } from "../lib/ai/prompts/box-analysis.js";

type SavedImage = {
  absolutePath: string;
  publicPath: string;
  buffer: Buffer;
  base64: string;
};

type AnalyzeResponseItem = AnalysisItem & {
  thumbnailPath: string | null;
  sourceImagePath: string | null;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 15 * 1024 * 1024,
  },
});

const imagesDirectory = path.resolve(process.cwd(), "data", "images");
const cropsDirectory = path.join(imagesDirectory, "crops");

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildImageFileName(baseTimestamp: number, index: number): string {
  return index === 0 ? `${baseTimestamp}.jpg` : `${baseTimestamp}_${index}.jpg`;
}

async function ensureImageDirectories(): Promise<void> {
  await mkdir(imagesDirectory, { recursive: true });
  await mkdir(cropsDirectory, { recursive: true });
}

async function saveUploadedImages(
  files: Express.Multer.File[],
  baseTimestamp: number,
): Promise<SavedImage[]> {
  await ensureImageDirectories();

  return Promise.all(
    files.map(async (file, index) => {
      const fileName = buildImageFileName(baseTimestamp, index);
      const absolutePath = path.join(imagesDirectory, fileName);
      const normalizedBuffer = await sharp(file.buffer).rotate().jpeg({ quality: 90 }).toBuffer();

      await writeFile(absolutePath, normalizedBuffer);

      return {
        absolutePath,
        publicPath: `/images/${fileName}`,
        buffer: normalizedBuffer,
        base64: normalizedBuffer.toString("base64"),
      };
    }),
  );
}

async function writeThumbnailCrop(
  source: SavedImage,
  bbox: AnalysisItemBoundingBox,
  cropFileName: string,
): Promise<string> {
  const metadata = await sharp(source.buffer).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Bildmetadaten konnten nicht gelesen werden.");
  }

  const left = clamp(Math.round(bbox.x * metadata.width), 0, metadata.width - 1);
  const top = clamp(Math.round(bbox.y * metadata.height), 0, metadata.height - 1);
  const width = clamp(Math.round(bbox.width * metadata.width), 1, metadata.width - left);
  const height = clamp(Math.round(bbox.height * metadata.height), 1, metadata.height - top);
  const absoluteCropPath = path.join(cropsDirectory, cropFileName);

  await sharp(source.buffer)
    .extract({ left, top, width, height })
    .jpeg({ quality: 88 })
    .toFile(absoluteCropPath);

  return `/images/crops/${cropFileName}`;
}

function getUploadedImageFiles(request: Express.Request): Express.Multer.File[] {
  const files = Array.isArray(request.files) ? request.files : [];
  return files.filter(
    (file) => file.fieldname === "images[]" || file.fieldname === "images",
  );
}

export const analyzeRouter = Router();

analyzeRouter.post("/", upload.any(), async (request, response) => {
  try {
    const modelId =
      typeof request.body.modelId === "string" ? request.body.modelId.trim() : "";
    const uploadedImages = getUploadedImageFiles(request);

    if (!modelId) {
      return response.status(400).json({ error: "modelId ist erforderlich." });
    }

    if (uploadedImages.length === 0) {
      return response.status(400).json({ error: "Mindestens ein Bild ist erforderlich." });
    }

    const baseTimestamp = Date.now();
    const savedImages = await saveUploadedImages(uploadedImages, baseTimestamp);
    const rawText = await analyzeImages({
      modelId,
      images: savedImages.map((image) => image.base64),
      prompt: BOX_ANALYSIS_PROMPT,
    });
    const parsedItems = parseAnalysis(rawText);

    const result: AnalyzeResponseItem[] = await Promise.all(
      parsedItems.map(async (item, itemIndex) => {
        const sourceIndex = clamp(item.sourceImageIndex ?? 0, 0, savedImages.length - 1);
        const sourceImage = savedImages[sourceIndex];
        if (!sourceImage) {
          throw new Error("Source image for analyze result not found.");
        }

        if (!item.bbox) {
          return {
            ...item,
            thumbnailPath: null,
            sourceImagePath: sourceImage.publicPath,
          };
        }

        const thumbnailPath = await writeThumbnailCrop(
          sourceImage,
          item.bbox,
          `${baseTimestamp}_${itemIndex}.jpg`,
        );

        return {
          ...item,
          thumbnailPath,
          sourceImagePath: sourceImage.publicPath,
        };
      }),
    );

    return response.json(result);
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return response.status(400).json({ error: error.message });
    }

    return response.status(502).json({
      error: error instanceof Error ? error.message : "Analyse konnte nicht ausgeführt werden.",
    });
  }
});
