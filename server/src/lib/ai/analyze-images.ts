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

function buildMockAnalysisRawText(): string {
  return JSON.stringify([
    {
      name: "Mock power adapter",
      description: "Black adapter with cable attached.",
      quantity: 1,
      sourceImageIndex: 0,
      bbox: {
        x: 0.12,
        y: 0.18,
        width: 0.46,
        height: 0.44,
      },
    },
    {
      name: "Mock cable bundle",
      description: "Mixed cables grouped together.",
      quantity: 2,
      sourceImageIndex: 0,
      bbox: {
        x: 0.52,
        y: 0.34,
        width: 0.3,
        height: 0.28,
      },
    },
  ]);
}

function getModelConfig(modelId: string): ModelConfig {
  const model = MODELS.find((entry) => entry.id === modelId);
  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  return model;
}

export async function analyzeImages(input: AnalyzeImagesInput): Promise<string> {
  if (process.env.AI_ANALYZE_USE_MOCK === "1") {
    return buildMockAnalysisRawText();
  }

  const model = getModelConfig(input.modelId);
  let rawText: string;

  if (model.protocol === "ollama") {
    rawText = await callOllama(model, input.prompt, input.images);
  } else if (model.protocol === "openai") {
    rawText = await callOpenAiCompatible(model, input.prompt, input.images);
  } else if (model.protocol === "vertex") {
    rawText = await callVertex(model, input.prompt, input.images);
  } else {
    rawText = await callAnthropic(model, input.prompt, input.images);
  }

  return rawText;
}
