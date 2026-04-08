import { Router } from "express";

import {
  getSettings,
  saveActiveModelId,
} from "../services/settings.js";
import { listModels } from "../services/models.js";

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

modelsRouter.get("/", async (_request, response) => {
  try {
    response.json(await listModels());
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Modelle konnten nicht geladen werden.",
    });
  }
});
