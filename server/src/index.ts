import "dotenv/config";

import path from "node:path";

import express from "express";

import { database } from "./db/index.js";
import { analyzeRouter } from "./routes/analyze.js";
import { boxesRouter } from "./routes/boxes.js";
import { healthRouter } from "./routes/health.js";
import { itemImageTitleRouter, itemImagesRouter } from "./routes/item-images.js";
import { boxItemsRouter, itemsRouter } from "./routes/items.js";
import { searchRouter } from "./routes/search.js";

const DEFAULT_SERVER_PORT = 4001;
const app = express();
const port = Number(process.env.PORT ?? DEFAULT_SERVER_PORT);

app.use(express.json({ limit: "10mb" }));
app.use("/images", express.static(path.resolve(process.cwd(), "data", "images")));
app.use("/api/health", healthRouter);
app.use("/api/analyze", analyzeRouter);
app.use("/api/boxes", boxesRouter);
app.use("/api/boxes", boxItemsRouter);
app.use("/api/items", itemsRouter);
app.use("/api/items", itemImagesRouter);
app.use("/api/item-images", itemImageTitleRouter);
app.use("/api/search", searchRouter);

app.get("/api", (_request, response) => {
  response.json({
    name: "kistenscanner-server",
    status: "ok",
    database: database.name,
  });
});

app.listen(port, () => {
  console.log(`kistenscanner-server listening on http://127.0.0.1:${port}`);
});
