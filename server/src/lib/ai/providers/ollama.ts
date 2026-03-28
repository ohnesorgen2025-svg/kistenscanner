import type { ModelConfig } from "../models.js";
import {
  fetchWithTimeout,
  getApiErrorMessage,
  getApiKey,
  normalizeEndpoint,
} from "./shared.js";

export async function callOllama(
  model: ModelConfig,
  prompt: string,
  images: string[],
): Promise<string> {
  const apiKey = getApiKey(model);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetchWithTimeout(`${normalizeEndpoint(model.endpoint)}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model.model,
      stream: false,
      messages: [
        {
          role: "user",
          content: prompt,
          images,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Modell nicht erreichbar (${await getApiErrorMessage(response)}).`);
  }

  const payload = (await response.json()) as {
    message?: { content?: string };
  };

  return payload.message?.content?.trim() ?? "";
}
