/**
 * ai-hub client — drop this file into any TypeScript project.
 *
 * Required env vars:
 *   AI_HUB_URL    — e.g. "http://localhost:3800"
 *   AI_HUB_TOKEN  — Bearer token
 *   AI_HUB_APP_ID — your app identifier (e.g. "kistenscanner")
 */

const AI_HUB_URL = process.env.AI_HUB_URL || "http://localhost:3800";
const AI_HUB_TOKEN = process.env.AI_HUB_TOKEN || "";
const AI_HUB_APP_ID = process.env.AI_HUB_APP_ID || "";

interface AppModel {
  modelId: string;
  modelName: string;
  modelTag: string;
  providerName: string;
  isDefault: boolean;
}

interface Provider {
  id: string;
  name: string;
  type: string;
  baseUrl: string | null;
  requiresKey: number;
}

async function hubFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${AI_HUB_URL}${path}`, {
    headers: { Authorization: `Bearer ${AI_HUB_TOKEN}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ai-hub ${path} failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Get all models assigned to this app. */
export async function getAppModels(): Promise<AppModel[]> {
  return hubFetch<AppModel[]>(`/api/app-models?app=${encodeURIComponent(AI_HUB_APP_ID)}`);
}

/** Get the default model for this app. Throws if none assigned. */
export async function getDefaultModel(): Promise<AppModel> {
  const models = await getAppModels();
  const def = models.find((m) => m.isDefault);
  if (!def) throw new Error(`No default model assigned for app "${AI_HUB_APP_ID}"`);
  return def;
}

/** Get decrypted API key for a provider. */
export async function getApiKey(providerId: string): Promise<string> {
  const data = await hubFetch<{ key: string }>(`/api/keys/${encodeURIComponent(providerId)}`);
  return data.key;
}

/** Get provider details. */
export async function getProvider(providerId: string): Promise<Provider> {
  return hubFetch<Provider>(`/api/providers/${encodeURIComponent(providerId)}`);
}

/**
 * Resolve everything needed to call an AI model:
 * - model tag (for the API call)
 * - provider type + base URL
 * - API key (if required)
 */
export async function resolveModel(model?: AppModel) {
  const m = model ?? (await getDefaultModel());
  const providerId = m.modelId.split(":")[0] ?? m.modelId;
  const provider = await getProvider(providerId);
  const apiKey = provider.requiresKey ? await getApiKey(providerId) : undefined;

  return {
    modelTag: m.modelTag,
    modelName: m.modelName,
    providerType: provider.type as "ollama" | "ollama-cloud" | "gemini" | "openai" | "anthropic" | "custom",
    baseUrl: provider.baseUrl,
    apiKey,
  };
}
