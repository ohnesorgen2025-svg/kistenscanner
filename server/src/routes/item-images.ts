import { Router } from "express";

import multer from "multer";

import { saveItemImageBuffer } from "../services/file-storage.js";
import { addItemImage, setTitleImage } from "../services/inventory.js";

function parseRouteId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Ungültige ID.");
  }

  return id;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 15 * 1024 * 1024,
  },
});

export const itemImagesRouter = Router();
export const itemImageTitleRouter = Router();

itemImagesRouter.post("/:id/images", upload.single("image"), async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ error: "Bild ist erforderlich." });
    }

    const rawItemId = request.params.id;
    if (typeof rawItemId !== "string") {
      return response.status(400).json({ error: "Ungültige ID." });
    }

    const itemId = parseRouteId(rawItemId);
    const imagePath = await saveItemImageBuffer(request.file.buffer);
    const item = addItemImage(itemId, imagePath);

    return response.status(201).json(item);
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return response.status(400).json({ error: error.message });
    }

    const message = error instanceof Error ? error.message : "Bild konnte nicht gespeichert werden.";
    return response.status(message === "Item nicht gefunden." ? 404 : 400).json({ error: message });
  }
});

itemImageTitleRouter.patch("/:id/title", (request, response) => {
  try {
    const itemImageId = parseRouteId(request.params.id);
    const item = setTitleImage(itemImageId);
    response.json(item);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Titelbild konnte nicht gesetzt werden.";
    response.status(message === "Item-Bild nicht gefunden." ? 404 : 400).json({ error: message });
  }
});
