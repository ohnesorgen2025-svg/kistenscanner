import { callOllama } from "./providers/ollama.js";
import { callOpenAiCompatible } from "./providers/openai-compatible.js";
import { resolveModelById } from "../../services/models.js";

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

export async function analyzeImages(input: AnalyzeImagesInput): Promise<string> {
  if (process.env.AI_ANALYZE_USE_MOCK === "1") {
    return buildMockAnalysisRawText();
  }

  const model = await resolveModelById(input.modelId);

  switch (model.providerType) {
    case "ollama":
    case "ollama-cloud":
      return callOllama(model, input.prompt, input.images);
    case "openai":
    case "gemini":
    case "anthropic":
    case "custom":
      return callOpenAiCompatible(model, input.prompt, input.images);
    default:
      throw new Error(`Unbekannter Provider-Typ: ${model.providerType}`);
  }
}
