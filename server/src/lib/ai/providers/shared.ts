import type { ModelConfig } from "../models.js";

const REQUEST_TIMEOUT_MS = 120_000;

const PROVIDER_API_KEY_ENV: Record<string, string> = {
  "ollama-cloud": "OLLAMA_CLOUD_API_KEY",
  "glm-cloud": "GLM_API_KEY",
};

export function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

export function getApiKey(model: ModelConfig): string | null {
  const envKey = model.apiKeyEnv ?? PROVIDER_API_KEY_ENV[model.provider];
  if (!envKey) {
    return null;
  }

  const value = process.env[envKey];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Analyse-Request hat das 120-Sekunden-Timeout überschritten.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getApiErrorMessage(response: Response): Promise<string> {
  const fallback = `${response.status} ${response.statusText}`;
  const rawBody = (await response.text()).trim();

  if (!rawBody) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawBody) as {
      error?: string | { message?: string };
      message?: string;
    };

    if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
      return `${fallback}: ${parsed.error.trim()}`;
    }

    if (
      parsed.error &&
      typeof parsed.error === "object" &&
      typeof parsed.error.message === "string" &&
      parsed.error.message.trim().length > 0
    ) {
      return `${fallback}: ${parsed.error.message.trim()}`;
    }

    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return `${fallback}: ${parsed.message.trim()}`;
    }
  } catch {
    return `${fallback}: ${rawBody}`;
  }

  return `${fallback}: ${rawBody}`;
}
