import { Router } from "express";

import { listActivity } from "../services/activity.js";

export const activityRouter = Router();

activityRouter.get("/", (request, response) => {
  const limitRaw = request.query.limit;
  const limit = typeof limitRaw === "string" ? Number(limitRaw) : 60;
  response.json(listActivity(Number.isFinite(limit) ? limit : 60));
});
