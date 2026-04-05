import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { analyzeImages } from "../lib/ai/analyze-images.js";
import { MODELS } from "../lib/ai/models.js";
import { getModelConfig, listModels } from "./models.js";

export type ProviderKeyId = "GEMINI" | "OLLAMA";

export type ProviderStatusMap = Record<ProviderKeyId, boolean>;
export type ProviderKeyValueMap = Record<ProviderKeyId, string>;

type StoredSettings = {
  activeModelId: string;
};

const dataDirectory = path.resolve(process.cwd(), "data");
const settingsFilePath = path.join(dataDirectory, "settings.json");
const envFilePath = path.join(dataDirectory, ".env");

const DEFAULT_ACTIVE_MODEL_ID = MODELS[0]?.id ?? "";

const providerEnvKeys = {
  GEMINI: "GEMINI_API_KEY",
  OLLAMA: "OLLAMA_API_KEY",
} satisfies Record<ProviderKeyId, string>;

const managedEnvKeys = [
  "OLLAMA_API_KEY",
  "GEMINI_API_KEY",
] as const;

const retiredManagedEnvKeys = [
  "OLLAMA_CLOUD_API_KEY",
  "GLM_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "VERTEX_API_KEY",
  "VERTEX_PROJECT_ID",
  "VERTEX_REGION",
] as const;

const allManagedEnvKeys = [...managedEnvKeys, ...retiredManagedEnvKeys] as const;
const legacyProviderEnvFallbacks = {
  GEMINI: [],
  OLLAMA: ["OLLAMA_CLOUD_API_KEY", "GLM_API_KEY"],
} satisfies Record<ProviderKeyId, string[]>;

async function ensureDataDirectory(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
}

function parseEnvLines(content: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1);
    values.set(key, value);
  }

  return values;
}

async function readEnvValues(): Promise<Map<string, string>> {
  try {
    const content = await readFile(envFilePath, "utf8");
    return parseEnvLines(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Map<string, string>();
    }

    throw error;
  }
}

function buildProviderStatuses(envValues: Map<string, string>): ProviderStatusMap {
  const hasConfiguredValue = (providerId: ProviderKeyId): boolean => {
    const keys = [providerEnvKeys[providerId], ...legacyProviderEnvFallbacks[providerId]];
    return keys.some((key) => {
      const envValue = envValues.get(key);
      if (typeof envValue === "string" && envValue.trim().length > 0) {
        return true;
      }

      const processValue = process.env[key];
      return typeof processValue === "string" && processValue.trim().length > 0;
    });
  };

  return {
    GEMINI: hasConfiguredValue("GEMINI"),
    OLLAMA: hasConfiguredValue("OLLAMA"),
  };
}

export async function getSettings(): Promise<{
  activeModelId: string;
  configuredProviders: ProviderStatusMap;
}> {
  await ensureDataDirectory();

  let activeModelId = DEFAULT_ACTIVE_MODEL_ID;
  try {
    const content = await readFile(settingsFilePath, "utf8");
    const parsed = JSON.parse(content) as Partial<StoredSettings>;
    const models = await listModels();
    if (
      typeof parsed.activeModelId === "string" &&
      models.some((model) => model.id === parsed.activeModelId)
    ) {
      activeModelId = parsed.activeModelId;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const envValues = await readEnvValues();
  return {
    activeModelId,
    configuredProviders: buildProviderStatuses(envValues),
  };
}

export async function saveActiveModelId(modelId: string): Promise<StoredSettings> {
  if (!(await getModelConfig(modelId))) {
    throw new Error("Ungültiges Modell.");
  }

  await ensureDataDirectory();
  const payload: StoredSettings = { activeModelId: modelId };
  await writeFile(settingsFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

export async function saveProviderKeys(
  values: Partial<ProviderKeyValueMap>,
): Promise<ProviderStatusMap> {
  await ensureDataDirectory();

  const existingEnvValues = await readEnvValues();
  const nextManagedValues = new Map<string, string>();
  const getExistingValue = (key: string): string => {
    const directValue = existingEnvValues.get(key) ?? process.env[key] ?? "";
    if (directValue.trim().length > 0) {
      return directValue;
    }

    if (key === "OLLAMA_API_KEY") {
      for (const legacyKey of legacyProviderEnvFallbacks.OLLAMA) {
        const legacyValue = existingEnvValues.get(legacyKey) ?? process.env[legacyKey] ?? "";
        if (legacyValue.trim().length > 0) {
          return legacyValue;
        }
      }
    }

    return "";
  };

  for (const key of managedEnvKeys) {
    nextManagedValues.set(key, getExistingValue(key));
  }

  for (const [provider, envKey] of Object.entries(providerEnvKeys) as Array<
    [ProviderKeyId, string]
  >) {
    if (provider in values) {
      nextManagedValues.set(envKey, values[provider] ?? "");
    }
  }

  let rawExistingContent = "";
  try {
    rawExistingContent = await readFile(envFilePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
  const filteredLines = rawExistingContent
    .split(/\r?\n/)
    .filter((line) => {
      const key = line.split("=")[0]?.trim();
      return !allManagedEnvKeys.includes(key as (typeof allManagedEnvKeys)[number]);
    })
    .filter((line, index, lines) => line.length > 0 || index < lines.length - 1);

  const managedLines = managedEnvKeys.map((key) => `${key}=${nextManagedValues.get(key) ?? ""}`);
  const nextContent = [...filteredLines.filter(Boolean), ...managedLines].join("\n").trimEnd();
  await writeFile(envFilePath, `${nextContent}\n`, "utf8");

  for (const key of managedEnvKeys) {
    process.env[key] = nextManagedValues.get(key) ?? "";
  }

  for (const key of retiredManagedEnvKeys) {
    delete process.env[key];
  }

  return buildProviderStatuses(nextManagedValues);
}

export async function testModelConnection(modelId: string): Promise<{ ok: true }> {
  if (!(await getModelConfig(modelId))) {
    throw new Error("Ungültiges Modell.");
  }

  await analyzeImages({
    modelId,
    prompt: "Antworte exakt mit [] und sonst nichts.",
    images: [],
  });

  return { ok: true };
}
