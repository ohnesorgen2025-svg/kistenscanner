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
    name: "Qwen3.5-9B",
    provider: "ollama",
    protocol: "ollama",
    endpoint: "https://ollama.com",
    model: "qwen3.5:9b",
    apiKeyEnv: "OLLAMA_API_KEY",
  },
  {
    id: "qwen35-397b-cloud",
    name: "Qwen3.5-397B",
    provider: "ollama",
    protocol: "ollama",
    endpoint: "https://ollama.com",
    model: "qwen3.5:397b-cloud",
    apiKeyEnv: "OLLAMA_API_KEY",
  },
  {
    id: "qwen3-vl-235b-cloud",
    name: "Qwen3-VL 235B",
    provider: "ollama",
    protocol: "ollama",
    endpoint: "https://ollama.com",
    model: "qwen3-vl:235b-cloud",
    apiKeyEnv: "OLLAMA_API_KEY",
  },
  {
    id: "glm-46v",
    name: "GLM-4.6V",
    provider: "ollama",
    protocol: "ollama",
    endpoint: "https://ollama.com",
    model: "glm-4.6:cloud",
    apiKeyEnv: "OLLAMA_API_KEY",
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
