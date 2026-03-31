import { Router } from "express";

import {
  CONTAINER_TYPES,
  createBox,
  deleteBox,
  getBoxById,
  getBoxByNumber,
  listBoxes,
  listLocations,
  listRootContainers,
  updateBox,
  type ContainerType,
} from "../services/inventory.js";

function parseRouteId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Ungültige ID.");
  }

  return id;
}

export const boxesRouter = Router();

boxesRouter.get("/root", (_request, response) => {
  response.json(listRootContainers());
});

boxesRouter.get("/container-types", (_request, response) => {
  response.json(CONTAINER_TYPES);
});

boxesRouter.get("/locations", (_request, response) => {
  response.json(listLocations());
});

boxesRouter.post("/", (request, response) => {
  try {
    const name = typeof request.body.name === "string" ? request.body.name : "";
    const location = typeof request.body.location === "string" ? request.body.location : "";
    const containerType = typeof request.body.containerType === "string" && CONTAINER_TYPES.includes(request.body.containerType as ContainerType)
      ? (request.body.containerType as ContainerType)
      : undefined;
    const parentId = typeof request.body.parentId === "number" && request.body.parentId > 0
      ? request.body.parentId
      : undefined;
    const imagePaths = Array.isArray(request.body.imagePaths)
      ? request.body.imagePaths.filter((value: unknown): value is string => typeof value === "string")
      : undefined;

    const box = createBox({
      name,
      location,
      ...(containerType ? { containerType } : {}),
      ...(parentId ? { parentId } : {}),
      ...(imagePaths ? { imagePaths } : {}),
    });
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

    if (process.env.DEBUG_BOX_THUMBNAILS === "1") {
      console.info(
        `[boxes] thumbnail debug for box ${box.id}`,
        box.items.map((item) => ({
          id: item.id,
          name: item.name,
          thumbnailPath: item.thumbnailPath,
        })),
      );
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
    const containerType = typeof request.body.containerType === "string" && CONTAINER_TYPES.includes(request.body.containerType as ContainerType)
      ? (request.body.containerType as ContainerType)
      : undefined;
    const parentIdValue = "parentId" in request.body
      ? (typeof request.body.parentId === "number" && request.body.parentId > 0 ? request.body.parentId : null)
      : undefined;
    const box = updateBox(boxId, {
      ...(typeof request.body.name === "string" ? { name: request.body.name } : {}),
      ...(typeof request.body.location === "string" ? { location: request.body.location } : {}),
      ...(containerType ? { containerType } : {}),
      ...(parentIdValue !== undefined ? { parentId: parentIdValue } : {}),
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
