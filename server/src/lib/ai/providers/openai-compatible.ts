import type { ResolvedModel } from "../models.js";
import {
  fetchWithTimeout,
  getApiErrorMessage,
  normalizeEndpoint,
} from "./shared.js";

export async function callOpenAiCompatible(
  model: ResolvedModel,
  prompt: string,
  images: string[],
): Promise<string> {
  if (!model.apiKey) {
    throw new Error(`API-Key für ${model.modelName} fehlt.`);
  }

  const response = await fetchWithTimeout(
    `${normalizeEndpoint(model.baseUrl ?? "https://api.openai.com")}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${model.apiKey}`,
      },
      body: JSON.stringify({
        model: model.modelTag,
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

  const responseText = await response.text();
  let payload: {
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
  try {
    payload = JSON.parse(responseText) as typeof payload;
  } catch {
    throw new Error(`Provider lieferte kein JSON. Anfang der Antwort: ${responseText.slice(0, 120)}`);
  }

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
