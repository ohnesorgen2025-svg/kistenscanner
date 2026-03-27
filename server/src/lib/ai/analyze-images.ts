import { MODELS, type ModelConfig } from "./models.js";
import { callAnthropic } from "./providers/anthropic.js";
import { callOllama } from "./providers/ollama.js";
import { callOpenAiCompatible } from "./providers/openai-compatible.js";
import { callVertex } from "./providers/vertex.js";

export type AnalyzeImagesInput = {
  modelId: string;
  images: string[];
  prompt: string;
};

function getModelConfig(modelId: string): ModelConfig {
  const model = MODELS.find((entry) => entry.id === modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return model;
}

export async function analyzeImages(input: AnalyzeImagesInput): Promise<string> {
  const model = getModelConfig(input.modelId);

  if (model.protocol === "ollama") {
    return callOllama(model, input.prompt, input.images);
  }

  if (model.protocol === "openai") {
    return callOpenAiCompatible(model, input.prompt, input.images);
  }

  if (model.protocol === "vertex") {
    return callVertex(model, input.prompt, input.images);
  }

  return callAnthropic(model, input.prompt, input.images);
}
