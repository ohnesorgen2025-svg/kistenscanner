import { Router } from "express";

import { searchItems } from "../services/inventory.js";

export const searchRouter = Router();

searchRouter.get("/", (request, response) => {
  const query = typeof request.query.q === "string" ? request.query.q : "";

  if (query.trim().length < 2) {
    return response.json([]);
  }

  return response.json(searchItems(query));
});
