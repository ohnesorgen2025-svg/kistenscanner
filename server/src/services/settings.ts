import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getDefaultModelId, listModels } from "./models.js";

type StoredSettings = {
  activeModelId: string;
};

const dataDirectory = path.resolve(process.cwd(), "data");
const settingsFilePath = path.join(dataDirectory, "settings.json");

async function ensureDataDirectory(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
}

export async function getSettings(): Promise<{ activeModelId: string }> {
  await ensureDataDirectory();

  let activeModelId = "";
  try {
    const content = await readFile(settingsFilePath, "utf8");
    const parsed = JSON.parse(content) as Partial<StoredSettings>;
    if (typeof parsed.activeModelId === "string") {
      const models = await listModels();
      if (models.some((model) => model.id === parsed.activeModelId)) {
        activeModelId = parsed.activeModelId;
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  if (!activeModelId) {
    activeModelId = (await getDefaultModelId()) ?? "";
  }

  return { activeModelId };
}

export async function saveActiveModelId(modelId: string): Promise<StoredSettings> {
  const models = await listModels();
  if (!models.some((m) => m.id === modelId)) {
    throw new Error("Ungültiges Modell.");
  }

  await ensureDataDirectory();
  const payload: StoredSettings = { activeModelId: modelId };
  await writeFile(settingsFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}
