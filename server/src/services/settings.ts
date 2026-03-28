import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { analyzeImages } from "../lib/ai/analyze-images.js";
import { MODELS } from "../lib/ai/models.js";

export type ProviderKeyId = "OPENAI" | "ANTHROPIC" | "GEMINI" | "OLLAMA" | "VERTEX";

export type ProviderStatusMap = Record<ProviderKeyId, boolean>;
export type ProviderKeyValueMap = Record<ProviderKeyId, string>;

type StoredSettings = {
  activeModelId: string;
};

const dataDirectory = path.resolve(process.cwd(), "data");
const settingsFilePath = path.join(dataDirectory, "settings.json");
const envFilePath = path.join(dataDirectory, ".env");

const DEFAULT_ACTIVE_MODEL_ID = MODELS[0]?.id ?? "";
const TINY_JPEG_BASE64 =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEA8PEA8PEA8PDw8PDw8PDw8QFREWFhURFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGxAQGy0mICYtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAgMBIgACEQEDEQH/xAAXAAADAQAAAAAAAAAAAAAAAAAAAQID/8QAFhEBAQEAAAAAAAAAAAAAAAAAAQAC/9oADAMBAAIQAxAAAAH2oA//xAAXEAADAQAAAAAAAAAAAAAAAAAAAREC/9oACAEBAAEFAqaf/8QAFhEBAQEAAAAAAAAAAAAAAAAAABEB/9oACAEDAQE/ASf/xAAVEQEBAAAAAAAAAAAAAAAAAAAAEf/aAAgBAgEBPwGn/8QAFxABAQEBAAAAAAAAAAAAAAAAAQARIf/aAAgBAQAGPwJq7//EABgQAAMBAQAAAAAAAAAAAAAAAAABESEx/9oACAEBAAE/IcRYN//aAAwDAQACAAMAAAAQ8//EABYRAQEBAAAAAAAAAAAAAAAAAAABEf/aAAgBAwEBPxClP//EABYRAQEBAAAAAAAAAAAAAAAAAAABEf/aAAgBAgEBPxClP//Z";

const providerEnvKeys = {
  OPENAI: "OPENAI_API_KEY",
  ANTHROPIC: "ANTHROPIC_API_KEY",
  GEMINI: "GEMINI_API_KEY",
  OLLAMA: "OLLAMA_CLOUD_API_KEY",
  VERTEX: "VERTEX_API_KEY",
} satisfies Record<ProviderKeyId, string>;

const managedEnvKeys = [
  "OLLAMA_CLOUD_API_KEY",
  "GLM_API_KEY",
  "GEMINI_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "VERTEX_API_KEY",
  "VERTEX_PROJECT_ID",
  "VERTEX_REGION",
] as const;

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
  return {
    OPENAI: Boolean(envValues.get(providerEnvKeys.OPENAI)?.trim() || process.env.OPENAI_API_KEY?.trim()),
    ANTHROPIC: Boolean(
      envValues.get(providerEnvKeys.ANTHROPIC)?.trim() || process.env.ANTHROPIC_API_KEY?.trim(),
    ),
    GEMINI: Boolean(envValues.get(providerEnvKeys.GEMINI)?.trim() || process.env.GEMINI_API_KEY?.trim()),
    OLLAMA: Boolean(
      envValues.get(providerEnvKeys.OLLAMA)?.trim() || process.env.OLLAMA_CLOUD_API_KEY?.trim(),
    ),
    VERTEX: Boolean(envValues.get(providerEnvKeys.VERTEX)?.trim() || process.env.VERTEX_API_KEY?.trim()),
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
    if (
      typeof parsed.activeModelId === "string" &&
      MODELS.some((model) => model.id === parsed.activeModelId)
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
  if (!MODELS.some((model) => model.id === modelId)) {
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

  for (const key of managedEnvKeys) {
    nextManagedValues.set(key, existingEnvValues.get(key) ?? process.env[key] ?? "");
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
      return !managedEnvKeys.includes(key as (typeof managedEnvKeys)[number]);
    })
    .filter((line, index, lines) => line.length > 0 || index < lines.length - 1);

  const managedLines = managedEnvKeys.map((key) => `${key}=${nextManagedValues.get(key) ?? ""}`);
  const nextContent = [...filteredLines.filter(Boolean), ...managedLines].join("\n").trimEnd();
  await writeFile(envFilePath, `${nextContent}\n`, "utf8");

  for (const key of managedEnvKeys) {
    process.env[key] = nextManagedValues.get(key) ?? "";
  }

  return buildProviderStatuses(nextManagedValues);
}

export async function testModelConnection(modelId: string): Promise<{ ok: true }> {
  if (!MODELS.some((model) => model.id === modelId)) {
    throw new Error("Ungültiges Modell.");
  }

  await analyzeImages({
    modelId,
    prompt: "Antworte exakt mit [] und sonst nichts.",
    images: [TINY_JPEG_BASE64],
  });

  return { ok: true };
}
