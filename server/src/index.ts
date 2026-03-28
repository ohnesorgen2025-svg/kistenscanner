import "dotenv/config";

import path from "node:path";

import express from "express";

import { database } from "./db/index.js";
import { analyzeRouter } from "./routes/analyze.js";
import { healthRouter } from "./routes/health.js";

const DEFAULT_SERVER_PORT = 4001;
const app = express();
const port = Number(process.env.PORT ?? DEFAULT_SERVER_PORT);

app.use(express.json({ limit: "10mb" }));
app.use("/images", express.static(path.resolve(process.cwd(), "data", "images")));
app.use("/api/health", healthRouter);
app.use("/api/analyze", analyzeRouter);

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
