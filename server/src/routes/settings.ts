import { Router } from "express";

import { MODELS } from "../lib/ai/models.js";
import {
  getSettings,
  saveActiveModelId,
  saveProviderKeys,
  testModelConnection,
} from "../services/settings.js";

export const settingsRouter = Router();
export const modelsRouter = Router();

settingsRouter.get("/", async (_request, response) => {
  try {
    response.json(await getSettings());
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Einstellungen konnten nicht geladen werden.",
    });
  }
});

settingsRouter.post("/", async (request, response) => {
  try {
    const modelId = typeof request.body.modelId === "string" ? request.body.modelId.trim() : "";
    if (!modelId) {
      return response.status(400).json({ error: "modelId ist erforderlich." });
    }

    const settings = await saveActiveModelId(modelId);
    return response.json(settings);
  } catch (error) {
    return response.status(400).json({
      error: error instanceof Error ? error.message : "Aktives Modell konnte nicht gespeichert werden.",
    });
  }
});

settingsRouter.post("/keys", async (request, response) => {
  try {
    const configuredProviders = await saveProviderKeys({
      OPENAI: typeof request.body.OPENAI === "string" ? request.body.OPENAI : undefined,
      ANTHROPIC: typeof request.body.ANTHROPIC === "string" ? request.body.ANTHROPIC : undefined,
      GEMINI: typeof request.body.GEMINI === "string" ? request.body.GEMINI : undefined,
      OLLAMA: typeof request.body.OLLAMA === "string" ? request.body.OLLAMA : undefined,
      VERTEX: typeof request.body.VERTEX === "string" ? request.body.VERTEX : undefined,
    });

    response.json({ configuredProviders });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Schlüssel konnten nicht gespeichert werden.",
    });
  }
});

settingsRouter.post("/test", async (request, response) => {
  try {
    const modelId = typeof request.body.modelId === "string" ? request.body.modelId.trim() : "";
    if (!modelId) {
      return response.status(400).json({ error: "modelId ist erforderlich." });
    }

    return response.json(await testModelConnection(modelId));
  } catch (error) {
    return response.status(502).json({
      error: error instanceof Error ? error.message : "Test-Verbindung fehlgeschlagen.",
    });
  }
});

modelsRouter.get("/", (_request, response) => {
  response.json(
    MODELS.map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      protocol: model.protocol,
    })),
  );
});
