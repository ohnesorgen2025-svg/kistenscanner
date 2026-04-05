export type ModelProtocol = "openai" | "ollama";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  protocol: ModelProtocol;
  endpoint: string;
  model: string;
  apiKey?: string;
  apiKeyEnv?: string;
}

export const MODELS: ModelConfig[] = [
  {
    id: "qwen35-9b-local",
    name: "Qwen3.5-9B (lokal)",
    provider: "ollama-local",
    protocol: "ollama",
    endpoint: "http://192.168.44.99:11434",
    model: "qwen3.5:9b",
  },
  {
    id: "qwen35-397b-cloud",
    name: "Qwen3.5-397B (Cloud)",
    provider: "ollama-cloud",
    protocol: "ollama",
    endpoint: "http://192.168.44.99:11434",
    model: "qwen3.5:397b-cloud",
  },
  {
    id: "qwen3-vl-235b-cloud",
    name: "Qwen3-VL 235B (Cloud)",
    provider: "ollama-cloud",
    protocol: "ollama",
    endpoint: "http://192.168.44.99:11434",
    model: "qwen3-vl:235b-cloud",
  },
  {
    id: "glm-46v",
    name: "GLM-4.6V",
    provider: "glm-cloud",
    protocol: "ollama",
    endpoint: "http://192.168.44.99:11434",
    model: "glm-4.6:cloud",
  },
  {
    id: "gemini-31-pro",
    name: "Gemini 3.1 Pro (AI Studio)",
    provider: "google",
    protocol: "openai",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.1-pro-preview",
    apiKeyEnv: "GEMINI_API_KEY",
  },
];
