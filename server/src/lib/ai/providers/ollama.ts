import type { ResolvedModel } from "../models.js";
import {
  fetchWithTimeout,
  getApiErrorMessage,
  normalizeEndpoint,
} from "./shared.js";

export async function callOllama(
  model: ResolvedModel,
  prompt: string,
  images: string[],
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (model.apiKey) {
    headers.Authorization = `Bearer ${model.apiKey}`;
  }

  const response = await fetchWithTimeout(`${normalizeEndpoint(model.baseUrl ?? "http://localhost:11434")}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model.modelTag,
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
