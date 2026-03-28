import { existsSync } from "node:fs";
import path from "node:path";

import dotenv from "dotenv";
import express from "express";

import { database } from "./db/index.js";
import { analyzeRouter } from "./routes/analyze.js";
import { boxesRouter } from "./routes/boxes.js";
import { healthRouter } from "./routes/health.js";
import { itemImageTitleRouter, itemImagesRouter } from "./routes/item-images.js";
import { boxItemsRouter, itemsRouter } from "./routes/items.js";
import { modelsRouter, settingsRouter } from "./routes/settings.js";
import { searchRouter } from "./routes/search.js";

const DEFAULT_SERVER_PORT = 4001;
const app = express();
const port = Number(process.env.PORT ?? DEFAULT_SERVER_PORT);
const dataEnvPath = path.resolve(process.cwd(), "data", ".env");
const clientDistDirectory = path.resolve(process.cwd(), "client", "dist");
const clientIndexPath = path.join(clientDistDirectory, "index.html");

dotenv.config();
dotenv.config({ path: dataEnvPath, override: true });

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
app.use("/api/settings", settingsRouter);
app.use("/api/models", modelsRouter);

app.get("/api", (_request, response) => {
  response.json({
    name: "kistenscanner-server",
    status: "ok",
    database: database.name,
  });
});

if (existsSync(clientIndexPath)) {
  app.use(express.static(clientDistDirectory));
  app.get(/^(?!\/api(?:\/|$)|\/images(?:\/|$)).*/, (_request, response) => {
    response.sendFile(clientIndexPath);
  });
}

app.listen(port, () => {
  console.log(`kistenscanner-server listening on http://127.0.0.1:${port}`);
});
