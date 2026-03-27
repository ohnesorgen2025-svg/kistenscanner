import express from "express";

import { database } from "./db/index.js";
import { healthRouter } from "./routes/health.js";

const DEFAULT_SERVER_PORT = 4001;
const app = express();
const port = Number(process.env.PORT ?? DEFAULT_SERVER_PORT);

app.use(express.json({ limit: "10mb" }));
app.use("/api/health", healthRouter);

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
