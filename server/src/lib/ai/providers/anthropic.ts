import type { ModelConfig } from "../models.js";
import {
  fetchWithTimeout,
  getApiErrorMessage,
  getApiKey,
  normalizeEndpoint,
} from "./shared.js";

export async function callAnthropic(
  model: ModelConfig,
  prompt: string,
  images: string[],
): Promise<string> {
  const apiKey = getApiKey(model);
  if (!apiKey) {
    throw new Error(`API-Key für ${model.name} fehlt (${model.apiKeyEnv ?? "unbekannt"}).`);
  }

  const endpoint = `${normalizeEndpoint(model.endpoint)}/v1/messages`;
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model.model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...images.map((image) => ({
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image,
              },
            })),
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Modell nicht erreichbar (${await getApiErrorMessage(response)}).`);
  }

  const payload = (await response.json()) as {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };

  return (payload.content ?? [])
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
}
