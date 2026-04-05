import { Router } from "express";

import {
  getSettings,
  saveActiveModelId,
  saveProviderKeys,
  testModelConnection,
} from "../services/settings.js";
import {
  addCustomOllamaModel,
  listModelSummaries,
  removeCustomOllamaModel,
} from "../services/models.js";

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
      GEMINI: typeof request.body.GEMINI === "string" ? request.body.GEMINI : undefined,
      OLLAMA: typeof request.body.OLLAMA === "string" ? request.body.OLLAMA : undefined,
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

modelsRouter.get("/", async (_request, response) => {
  try {
    response.json(await listModelSummaries());
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Modelle konnten nicht geladen werden.",
    });
  }
});

modelsRouter.post("/ollama", async (request, response) => {
  try {
    const modelTag =
      typeof request.body.modelTag === "string" ? request.body.modelTag.trim() : "";
    if (!modelTag) {
      return response.status(400).json({ error: "modelTag ist erforderlich." });
    }

    return response.status(201).json(await addCustomOllamaModel(modelTag));
  } catch (error) {
    return response.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Benutzerdefiniertes Ollama-Modell konnte nicht gespeichert werden.",
    });
  }
});

modelsRouter.delete("/ollama/:id", async (request, response) => {
  try {
    const modelId = typeof request.params.id === "string" ? request.params.id.trim() : "";
    if (!modelId) {
      return response.status(400).json({ error: "id ist erforderlich." });
    }

    await removeCustomOllamaModel(modelId);
    return response.status(204).send();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Benutzerdefiniertes Ollama-Modell konnte nicht entfernt werden.";

    return response.status(message.includes("nicht gefunden") ? 404 : 400).json({ error: message });
  }
});
