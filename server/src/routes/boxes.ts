import { Router } from "express";

import {
  createBox,
  deleteBox,
  getBoxById,
  getBoxByNumber,
  listBoxes,
  updateBox,
} from "../services/inventory.js";

function parseRouteId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Ungültige ID.");
  }

  return id;
}

export const boxesRouter = Router();

boxesRouter.post("/", (request, response) => {
  try {
    const name = typeof request.body.name === "string" ? request.body.name : "";
    const location = typeof request.body.location === "string" ? request.body.location : "";
    const imagePaths = Array.isArray(request.body.imagePaths)
      ? request.body.imagePaths.filter((value: unknown): value is string => typeof value === "string")
      : undefined;

    const box = createBox({ name, location, imagePaths });
    response.status(201).json(box);
  } catch (error) {
    response.status(400).json({
      error: error instanceof Error ? error.message : "Box konnte nicht erstellt werden.",
    });
  }
});

boxesRouter.get("/", (request, response) => {
  const rawNumber = request.query.number;
  if (typeof rawNumber === "string" && rawNumber.trim().length > 0) {
    const boxNumber = Number(rawNumber);
    if (!Number.isInteger(boxNumber) || boxNumber <= 0) {
      return response.status(400).json({ error: "Ungültige Kistennummer." });
    }

    const box = getBoxByNumber(boxNumber);
    if (!box) {
      return response.status(404).json({ error: "Kiste nicht gefunden." });
    }

    return response.json(box);
  }

  return response.json(listBoxes());
});

boxesRouter.get("/:id", (request, response) => {
  try {
    const boxId = parseRouteId(request.params.id);
    const box = getBoxById(boxId);
    if (!box) {
      return response.status(404).json({ error: "Box nicht gefunden." });
    }

    return response.json(box);
  } catch (error) {
    return response.status(400).json({
      error: error instanceof Error ? error.message : "Box konnte nicht geladen werden.",
    });
  }
});

boxesRouter.patch("/:id", (request, response) => {
  try {
    const boxId = parseRouteId(request.params.id);
    const box = updateBox(boxId, {
      name: typeof request.body.name === "string" ? request.body.name : undefined,
      location: typeof request.body.location === "string" ? request.body.location : undefined,
    });

    response.json(box);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Box konnte nicht aktualisiert werden.";
    response.status(message === "Box nicht gefunden." ? 404 : 400).json({ error: message });
  }
});

boxesRouter.delete("/:id", (request, response) => {
  try {
    const boxId = parseRouteId(request.params.id);
    deleteBox(boxId);
    response.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Box konnte nicht gelöscht werden.";
    response.status(message === "Box nicht gefunden." ? 404 : 400).json({ error: message });
  }
});
