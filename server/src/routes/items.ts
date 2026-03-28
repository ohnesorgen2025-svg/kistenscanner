import { Router } from "express";

import {
  createItem,
  deleteItem,
  moveItem,
  updateItem,
} from "../services/inventory.js";

function parseRouteId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Ungültige ID.");
  }

  return id;
}

export const boxItemsRouter = Router();
export const itemsRouter = Router();

boxItemsRouter.post("/:id/items", (request, response) => {
  try {
    const boxId = parseRouteId(request.params.id);
    const item = createItem(boxId, {
      name: typeof request.body.name === "string" ? request.body.name : "",
      description:
        typeof request.body.description === "string" ? request.body.description : undefined,
      detail: typeof request.body.detail === "string" ? request.body.detail : undefined,
      thumbnailPath:
        typeof request.body.thumbnailPath === "string" ? request.body.thumbnailPath : undefined,
    });

    response.status(201).json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Item konnte nicht erstellt werden.";
    response.status(message === "Box nicht gefunden." ? 404 : 400).json({ error: message });
  }
});

itemsRouter.patch("/:id", (request, response) => {
  try {
    const itemId = parseRouteId(request.params.id);
    const item = updateItem(itemId, {
      name: typeof request.body.name === "string" ? request.body.name : undefined,
      description:
        typeof request.body.description === "string" ? request.body.description : undefined,
      detail: typeof request.body.detail === "string" ? request.body.detail : undefined,
    });

    response.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Item konnte nicht aktualisiert werden.";
    response.status(message === "Item nicht gefunden." ? 404 : 400).json({ error: message });
  }
});

itemsRouter.delete("/:id", (request, response) => {
  try {
    const itemId = parseRouteId(request.params.id);
    deleteItem(itemId);
    response.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Item konnte nicht gelöscht werden.";
    response.status(message === "Item nicht gefunden." ? 404 : 400).json({ error: message });
  }
});

itemsRouter.patch("/:id/move", (request, response) => {
  try {
    const itemId = parseRouteId(request.params.id);
    const targetBoxId = Number(request.body.targetBoxId);

    if (!Number.isInteger(targetBoxId) || targetBoxId <= 0) {
      return response.status(400).json({ error: "targetBoxId ist erforderlich." });
    }

    const item = moveItem(itemId, targetBoxId);
    return response.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Item konnte nicht verschoben werden.";
    const status = message === "Item nicht gefunden." || message === "Box nicht gefunden." ? 404 : 400;
    return response.status(status).json({ error: message });
  }
});
