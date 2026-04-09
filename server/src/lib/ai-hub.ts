/**
 * ai-hub client — drop this file into any TypeScript project.
 *
 * Required env vars:
 *   AI_HUB_URL    — e.g. "http://localhost:3800"
 *   AI_HUB_TOKEN  — Bearer token
 *   AI_HUB_APP_ID — your app identifier (e.g. "kistenscanner")
 *
 * Env vars are read lazily at call time, not at import time,
 * so dotenv or other env initialization can run after import.
 */

function getAiHubConfig() {
  return {
    url: process.env.AI_HUB_URL || "http://localhost:3800",
    token: process.env.AI_HUB_TOKEN || "",
    appId: process.env.AI_HUB_APP_ID || "",
  };
}

interface AppModel {
  modelId: string;
  providerId: string;
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
  const { url, token } = getAiHubConfig();
  const res = await fetch(`${url}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ai-hub ${path} failed (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Get all models assigned to this app. */
export async function getAppModels(): Promise<AppModel[]> {
  const { appId } = getAiHubConfig();
  return hubFetch<AppModel[]>(`/api/app-models?app=${encodeURIComponent(appId)}`);
}

/** Get the default model for this app. Throws if none assigned. */
export async function getDefaultModel(): Promise<AppModel> {
  const { appId } = getAiHubConfig();
  const models = await getAppModels();
  const def = models.find((m) => m.isDefault);
  if (!def) throw new Error(`No default model assigned for app "${appId}"`);
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
  const provider = await getProvider(m.providerId);
  const apiKey = provider.requiresKey ? await getApiKey(m.providerId) : undefined;

  return {
    modelTag: m.modelTag,
    modelName: m.modelName,
    providerType: provider.type as "ollama" | "ollama-cloud" | "gemini" | "openai" | "anthropic" | "custom",
    baseUrl: provider.baseUrl,
    apiKey,
  };
}
