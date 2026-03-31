import { Router } from "express";
import multer from "multer";
import sharp from "sharp";

import { analyzeImages } from "../lib/ai/analyze-images.js";
import {
  buildDuplicateDetectionPrompt,
  buildReorganizationPrompt,
  buildRescanPrompt,
  buildSmartSearchPrompt,
  buildVisualSearchPrompt,
} from "../lib/ai/prompts/box-analysis.js";
import {
  getBoxById,
  getInventoryStats,
  listAllItemsFlat,
  listBoxesWithItems,
} from "../services/inventory.js";
import { getSettings } from "../services/settings.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10, fileSize: 15 * 1024 * 1024 },
});

function extractJsonArray(text: string): unknown[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]) as unknown[];
  } catch {
    return [];
  }
}

function extractJsonObject(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function resolveModelId(requestedModelId: string | undefined): Promise<string> {
  const settings = await getSettings();
  const modelId = requestedModelId?.trim() || settings.activeModelId;
  if (!modelId) throw new Error("Kein aktives Modell konfiguriert.");
  return modelId;
}

export const aiFeaturesRouter = Router();

// Re-scan an existing box with new photos
aiFeaturesRouter.post("/rescan/:boxId", upload.any(), async (request, response) => {
  try {
    const boxId = Number(request.params.boxId);
    if (!Number.isInteger(boxId) || boxId <= 0) {
      return response.status(400).json({ error: "Ungültige Box-ID." });
    }

    const box = getBoxById(boxId);
    if (!box) {
      return response.status(404).json({ error: "Box nicht gefunden." });
    }

    const uploadedFiles = Array.isArray(request.files) ? request.files : [];
    if (uploadedFiles.length === 0) {
      return response.status(400).json({ error: "Mindestens ein Bild ist erforderlich." });
    }

    const modelId = await resolveModelId(
      typeof request.body.modelId === "string" ? request.body.modelId : undefined,
    );

    const images = await Promise.all(
      uploadedFiles.map(async (file) => {
        const buffer = await sharp(file.buffer).rotate().jpeg({ quality: 90 }).toBuffer();
        return buffer.toString("base64");
      }),
    );

    const existingItems = box.items.map((item) => ({
      name: item.name,
      description: item.description,
    }));

    const prompt = buildRescanPrompt(existingItems);
    const rawText = await analyzeImages({ modelId, images, prompt });
    const result = extractJsonObject(rawText);

    return response.json({
      added: Array.isArray(result.added) ? result.added : [],
      improved: Array.isArray(result.improved) ? result.improved : [],
      removed: Array.isArray(result.removed) ? result.removed : [],
    });
  } catch (error) {
    return response.status(502).json({
      error: error instanceof Error ? error.message : "Re-Scan fehlgeschlagen.",
    });
  }
});

// AI-powered smart search
aiFeaturesRouter.post("/smart-search", async (request, response) => {
  try {
    const query = typeof request.body.query === "string" ? request.body.query.trim() : "";
    if (query.length < 2) {
      return response.json([]);
    }

    const modelId = await resolveModelId(
      typeof request.body.modelId === "string" ? request.body.modelId : undefined,
    );

    const allItems = listAllItemsFlat();
    if (allItems.length === 0) {
      return response.json([]);
    }

    const prompt = buildSmartSearchPrompt(query, allItems);
    const rawText = await analyzeImages({ modelId, images: [], prompt });
    const matchedIds = extractJsonArray(rawText).filter(
      (id): id is number => typeof id === "number",
    );

    const results = matchedIds
      .map((id) => allItems.find((item) => item.id === id))
      .filter(Boolean);

    return response.json(results);
  } catch (error) {
    return response.status(502).json({
      error: error instanceof Error ? error.message : "KI-Suche fehlgeschlagen.",
    });
  }
});

// Visual search — find items by photo
aiFeaturesRouter.post("/visual-search", upload.any(), async (request, response) => {
  try {
    const uploadedFiles = Array.isArray(request.files) ? request.files : [];
    if (uploadedFiles.length === 0) {
      return response.status(400).json({ error: "Mindestens ein Bild ist erforderlich." });
    }

    const modelId = await resolveModelId(
      typeof request.body.modelId === "string" ? request.body.modelId : undefined,
    );

    const images = await Promise.all(
      uploadedFiles.map(async (file) => {
        const buffer = await sharp(file.buffer).rotate().jpeg({ quality: 90 }).toBuffer();
        return buffer.toString("base64");
      }),
    );

    const allItems = listAllItemsFlat();
    if (allItems.length === 0) {
      return response.json([]);
    }

    const prompt = buildVisualSearchPrompt(allItems);
    const rawText = await analyzeImages({ modelId, images, prompt });
    const matchedIds = extractJsonArray(rawText).filter(
      (id): id is number => typeof id === "number",
    );

    const results = matchedIds
      .map((id) => allItems.find((item) => item.id === id))
      .filter(Boolean);

    return response.json(results);
  } catch (error) {
    return response.status(502).json({
      error: error instanceof Error ? error.message : "Foto-Suche fehlgeschlagen.",
    });
  }
});

// Duplicate detection
aiFeaturesRouter.post("/duplicates", async (request, response) => {
  try {
    const modelId = await resolveModelId(
      typeof request.body.modelId === "string" ? request.body.modelId : undefined,
    );

    const allItems = listAllItemsFlat();
    if (allItems.length < 2) {
      return response.json([]);
    }

    const prompt = buildDuplicateDetectionPrompt(
      allItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        boxId: item.boxId,
        boxName: item.boxName,
      })),
    );

    const rawText = await analyzeImages({ modelId, images: [], prompt });
    const groups = extractJsonArray(rawText);

    return response.json(groups);
  } catch (error) {
    return response.status(502).json({
      error: error instanceof Error ? error.message : "Duplikat-Erkennung fehlgeschlagen.",
    });
  }
});

// Smart reorganization suggestions
aiFeaturesRouter.post("/reorganize", async (request, response) => {
  try {
    const modelId = await resolveModelId(
      typeof request.body.modelId === "string" ? request.body.modelId : undefined,
    );

    const boxesWithItems = listBoxesWithItems();
    if (boxesWithItems.length < 2) {
      return response.json([]);
    }

    const prompt = buildReorganizationPrompt(boxesWithItems);
    const rawText = await analyzeImages({ modelId, images: [], prompt });
    const suggestions = extractJsonArray(rawText);

    return response.json(suggestions);
  } catch (error) {
    return response.status(502).json({
      error: error instanceof Error ? error.message : "Reorganisation fehlgeschlagen.",
    });
  }
});

// Inventory statistics for dashboard
aiFeaturesRouter.get("/stats", (_request, response) => {
  const stats = getInventoryStats();
  return response.json(stats);
});

// CSV export
aiFeaturesRouter.get("/export/csv", (_request, response) => {
  const boxes = listBoxesWithItems();

  const lines: string[] = ["Kiste #;Name;Standort;Item;Beschreibung"];
  for (const box of boxes) {
    if (box.items.length === 0) {
      lines.push(`${box.number};${csvEscape(box.name)};${csvEscape(box.location)};;`);
    }
    for (const item of box.items) {
      lines.push(
        `${box.number};${csvEscape(box.name)};${csvEscape(box.location)};${csvEscape(item.name)};${csvEscape(item.description ?? "")}`,
      );
    }
  }

  const csv = lines.join("\n");
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", "attachment; filename=kistenscanner-inventar.csv");
  return response.send("\uFEFF" + csv);
});

// JSON export
aiFeaturesRouter.get("/export/json", (_request, response) => {
  const boxes = listBoxesWithItems();
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Content-Disposition", "attachment; filename=kistenscanner-inventar.json");
  return response.json(boxes);
});

function csvEscape(value: string): string {
  if (value.includes(";") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
