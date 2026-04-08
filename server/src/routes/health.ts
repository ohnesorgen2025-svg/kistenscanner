import { Router } from "express";

import { database } from "../db/index.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  const databaseStatus = database
    .prepare("SELECT 'ok' AS status")
    .get() as { status: string };

  response.json({
    status: "ok",
    version: "ai-hub-v2",
    database: databaseStatus.status,
    timestamp: new Date().toISOString(),
  });
});
