import type { ModelConfig } from "../models.js";

export async function callOllama(
  _model: ModelConfig,
  _prompt: string,
  _images: string[],
): Promise<string> {
  throw new Error("Ollama provider not implemented yet.");
}
