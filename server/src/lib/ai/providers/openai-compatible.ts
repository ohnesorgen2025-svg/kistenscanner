import type { ModelConfig } from "../models.js";

export async function callOpenAiCompatible(
  _model: ModelConfig,
  _prompt: string,
  _images: string[],
): Promise<string> {
  throw new Error("OpenAI-compatible provider not implemented yet.");
}
