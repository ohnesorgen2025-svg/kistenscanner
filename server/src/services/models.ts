import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { MODELS as BUILTIN_MODELS, type ModelConfig } from "../lib/ai/models.js";

type CustomOllamaModelRecord = {
  id: string;
  name: string;
  model: string;
};

type StoredCustomModels = {
  ollama: CustomOllamaModelRecord[];
};

export type ModelSummary = {
  id: string;
  name: string;
  provider: string;
  protocol: string;
  isCustom: boolean;
};

const dataDirectory = path.resolve(process.cwd(), "data");
const customModelsFilePath = path.join(dataDirectory, "custom-models.json");
const DEFAULT_CUSTOM_MODELS: StoredCustomModels = { ollama: [] };
const BUILTIN_MODEL_IDS = new Set(BUILTIN_MODELS.map((model) => model.id));

async function ensureDataDirectory(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
}

function normalizeOllamaTag(value: string): string {
  return value.trim();
}

function buildOllamaCustomId(modelTag: string, takenIds: Set<string>): string {
  const base =
    modelTag
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "model";

  let candidate = `ollama-custom-${base}`;
  let suffix = 2;

  while (takenIds.has(candidate)) {
    candidate = `ollama-custom-${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function readStoredCustomModels(): Promise<StoredCustomModels> {
  await ensureDataDirectory();

  try {
    const content = await readFile(customModelsFilePath, "utf8");
    const parsed = JSON.parse(content) as Partial<StoredCustomModels>;
    const ollama = Array.isArray(parsed.ollama)
      ? parsed.ollama.filter(
          (entry): entry is CustomOllamaModelRecord =>
            Boolean(
              entry &&
                typeof entry === "object" &&
                typeof entry.id === "string" &&
                entry.id.trim().length > 0 &&
                typeof entry.name === "string" &&
                entry.name.trim().length > 0 &&
                typeof entry.model === "string" &&
                entry.model.trim().length > 0,
            ),
        )
      : [];

    return { ollama };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return DEFAULT_CUSTOM_MODELS;
    }

    throw error;
  }
}

async function writeStoredCustomModels(payload: StoredCustomModels): Promise<void> {
  await ensureDataDirectory();
  await writeFile(customModelsFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function toCustomOllamaModel(record: CustomOllamaModelRecord): ModelConfig {
  return {
    id: record.id,
    name: record.name,
    provider: "ollama",
    protocol: "ollama",
    endpoint: "https://ollama.com",
    model: record.model,
    apiKeyEnv: "OLLAMA_API_KEY",
  };
}

export async function listModels(): Promise<ModelConfig[]> {
  const stored = await readStoredCustomModels();
  return [...BUILTIN_MODELS, ...stored.ollama.map(toCustomOllamaModel)];
}

export async function getModelConfig(modelId: string): Promise<ModelConfig | null> {
  const models = await listModels();
  return models.find((model) => model.id === modelId) ?? null;
}

export async function listModelSummaries(): Promise<ModelSummary[]> {
  const models = await listModels();
  return models.map((model) => ({
    id: model.id,
    name: model.name,
    provider: model.provider,
    protocol: model.protocol,
    isCustom: !BUILTIN_MODEL_IDS.has(model.id),
  }));
}

export async function addCustomOllamaModel(modelTag: string): Promise<ModelSummary> {
  const normalizedTag = normalizeOllamaTag(modelTag);
  if (!normalizedTag) {
    throw new Error("Modell-Tag ist erforderlich.");
  }

  const stored = await readStoredCustomModels();
  const existingModels = await listModels();

  if (
    existingModels.some(
      (model) => model.protocol === "ollama" && model.model.toLowerCase() === normalizedTag.toLowerCase(),
    )
  ) {
    throw new Error("Dieses Ollama-Modell ist bereits vorhanden.");
  }

  const takenIds = new Set(existingModels.map((model) => model.id));
  const record: CustomOllamaModelRecord = {
    id: buildOllamaCustomId(normalizedTag, takenIds),
    name: normalizedTag,
    model: normalizedTag,
  };

  const nextPayload: StoredCustomModels = {
    ollama: [...stored.ollama, record],
  };
  await writeStoredCustomModels(nextPayload);

  return {
    id: record.id,
    name: record.name,
    provider: "ollama",
    protocol: "ollama",
    isCustom: true,
  };
}

export async function removeCustomOllamaModel(modelId: string): Promise<void> {
  const stored = await readStoredCustomModels();
  const nextModels = stored.ollama.filter((model) => model.id !== modelId);

  if (nextModels.length === stored.ollama.length) {
    throw new Error("Benutzerdefiniertes Ollama-Modell nicht gefunden.");
  }

  await writeStoredCustomModels({ ollama: nextModels });
}
