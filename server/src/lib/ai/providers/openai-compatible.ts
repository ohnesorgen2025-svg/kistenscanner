import type { ModelConfig } from "../models.js";
import {
  fetchWithTimeout,
  getApiErrorMessage,
  getApiKey,
  normalizeEndpoint,
} from "./shared.js";

export async function callOpenAiCompatible(
  model: ModelConfig,
  prompt: string,
  images: string[],
): Promise<string> {
  const apiKey = getApiKey(model);
  if (!apiKey) {
    throw new Error(`API-Key für ${model.name} fehlt (${model.apiKeyEnv ?? "unbekannt"}).`);
  }

  const response = await fetchWithTimeout(
    `${normalizeEndpoint(model.endpoint)}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.model,
        max_completion_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              ...images.map((image) => ({
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              })),
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Modell nicht erreichbar (${await getApiErrorMessage(response)}).`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?:
          | string
          | Array<{
              type?: string;
              text?: string;
            }>;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }

  return "";
}
