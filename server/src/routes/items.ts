import { Router } from "express";

import {
  batchDeleteItems,
  batchMoveItems,
  createItem,
  deleteItem,
  moveItem,
  updateItem,
  updateItemQuantity,
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

itemsRouter.post("/batch-move", (request, response) => {
  try {
    const itemIds = request.body.itemIds;
    const targetBoxId = Number(request.body.targetBoxId);

    if (!Array.isArray(itemIds) || itemIds.length === 0 || !itemIds.every((id: unknown) => typeof id === "number" && Number.isInteger(id) && id > 0)) {
      return response.status(400).json({ error: "itemIds muss ein Array von gültigen IDs sein." });
    }
    if (!Number.isInteger(targetBoxId) || targetBoxId <= 0) {
      return response.status(400).json({ error: "targetBoxId ist erforderlich." });
    }

    batchMoveItems(itemIds as number[], targetBoxId);
    return response.json({ moved: itemIds.length });
  } catch (error) {
    return response.status(400).json({ error: error instanceof Error ? error.message : "Batch-Verschieben fehlgeschlagen." });
  }
});

itemsRouter.post("/batch-delete", (request, response) => {
  try {
    const itemIds = request.body.itemIds;

    if (!Array.isArray(itemIds) || itemIds.length === 0 || !itemIds.every((id: unknown) => typeof id === "number" && Number.isInteger(id) && id > 0)) {
      return response.status(400).json({ error: "itemIds muss ein Array von gültigen IDs sein." });
    }

    batchDeleteItems(itemIds as number[]);
    return response.json({ deleted: itemIds.length });
  } catch (error) {
    return response.status(400).json({ error: error instanceof Error ? error.message : "Batch-Löschen fehlgeschlagen." });
  }
});

boxItemsRouter.post("/:id/items", (request, response) => {
  try {
    const boxId = parseRouteId(request.params.id);
    const item = createItem(boxId, {
      name: typeof request.body.name === "string" ? request.body.name : "",
      description:
        typeof request.body.description === "string" ? request.body.description : undefined,
      detail: typeof request.body.detail === "string" ? request.body.detail : undefined,
      quantity: typeof request.body.quantity === "number" ? request.body.quantity : undefined,
      quantityUnit: typeof request.body.quantityUnit === "string" ? request.body.quantityUnit : undefined,
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

itemsRouter.patch("/:id/quantity", (request, response) => {
  try {
    const itemId = parseRouteId(request.params.id);
    const quantity = Number(request.body.quantity);

    if (!Number.isFinite(quantity) || quantity < 0) {
      return response.status(400).json({ error: "Ungültige Menge." });
    }

    const quantityUnit = typeof request.body.quantityUnit === "string" ? request.body.quantityUnit : undefined;
    const item = updateItemQuantity(itemId, quantity, quantityUnit);
    return response.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Menge konnte nicht aktualisiert werden.";
    return response.status(message === "Item nicht gefunden." ? 404 : 400).json({ error: message });
  }
});
