import { getAppModels, resolveModel } from "../lib/ai-hub.js";
import type { ResolvedModel } from "../lib/ai/models.js";

export type ModelSummary = {
  id: string;
  name: string;
  provider: string;
};

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedModels: ModelSummary[] | null = null;
let cacheTimestamp = 0;

export async function listModels(): Promise<ModelSummary[]> {
  const now = Date.now();
  if (cachedModels && now - cacheTimestamp < MODEL_CACHE_TTL_MS) {
    return cachedModels;
  }

  try {
    const appModels = await getAppModels();
    cachedModels = appModels.map((m) => ({
      id: m.modelId,
      name: m.modelName,
      provider: m.providerName,
    }));
    cacheTimestamp = now;
  } catch {
    if (cachedModels) {
      return cachedModels;
    }
    throw new Error("ai-hub nicht erreichbar und kein Cache vorhanden.");
  }

  return cachedModels;
}

export async function getDefaultModelId(): Promise<string | null> {
  try {
    const appModels = await getAppModels();
    const def = appModels.find((m) => m.isDefault);
    return def?.modelId ?? appModels[0]?.modelId ?? null;
  } catch {
    return cachedModels?.[0]?.id ?? null;
  }
}

export async function resolveModelById(modelId: string): Promise<ResolvedModel> {
  const appModels = await getAppModels();
  const match = appModels.find((m) => m.modelId === modelId);
  if (!match) {
    throw new Error(`Modell "${modelId}" ist dieser App nicht zugewiesen.`);
  }
  return resolveModel(match);
}
