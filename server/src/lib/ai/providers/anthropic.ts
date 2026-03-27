import type { ModelConfig } from "../models.js";

export async function callAnthropic(
  _model: ModelConfig,
  _prompt: string,
  _images: string[],
): Promise<string> {
  throw new Error("Anthropic provider not implemented yet.");
}
