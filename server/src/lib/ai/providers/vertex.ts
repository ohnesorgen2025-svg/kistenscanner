import type { ModelConfig } from "../models.js";

const REQUEST_TIMEOUT_MS = 120_000;

function getApiKey(model: ModelConfig): string | null {
  if (!model.apiKeyEnv) {
    return null;
  }

  const value = process.env[model.apiKeyEnv];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function buildVertexUrl(model: ModelConfig, apiKey: string): string {
  return (
    `https://aiplatform.googleapis.com/v1/publishers/google/models/${model.model}` +
    `:generateContent?key=${encodeURIComponent(apiKey)}`
  );
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
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

async function getApiErrorMessage(response: Response): Promise<string> {
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

function extractVertexText(payload: {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}): string {
  return (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

export async function callVertex(
  model: ModelConfig,
  prompt: string,
  images: string[],
): Promise<string> {
  const apiKey = getApiKey(model);
  if (!apiKey) {
    throw new Error(`API-Key für ${model.name} fehlt (${model.apiKeyEnv ?? "unbekannt"}).`);
  }

  const url = buildVertexUrl(model, apiKey);
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...images.map((image) => ({
              inlineData: {
                mimeType: "image/jpeg",
                data: image,
              },
            })),
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const errorMessage = await getApiErrorMessage(response);

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Vertex Auth Fehler — pruefe API Key und Projekt (${errorMessage}).`);
    }

    if (response.status === 429) {
      throw new Error(`Vertex Quota erreicht (${errorMessage}).`);
    }

    throw new Error(`Modell nicht erreichbar (${errorMessage}).`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return extractVertexText(payload);
}
