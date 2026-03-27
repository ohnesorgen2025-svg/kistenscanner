export type ModelProtocol = "openai" | "anthropic" | "ollama" | "vertex";

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
    id: "gemini-31-pro-vertex",
    name: "Gemini 3.1 Pro (Vertex AI)",
    provider: "google-vertex",
    protocol: "vertex",
    endpoint: "https://europe-west1-aiplatform.googleapis.com",
    model: "gemini-3.1-pro-preview",
    apiKeyEnv: "VERTEX_API_KEY",
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
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    protocol: "anthropic",
    endpoint: "https://api.anthropic.com",
    model: "claude-sonnet-4-6",
    apiKeyEnv: "ANTHROPIC_API_KEY",
  },
  {
    id: "claude-opus-4",
    name: "Claude Opus 4.6",
    provider: "anthropic",
    protocol: "anthropic",
    endpoint: "https://api.anthropic.com",
    model: "claude-opus-4-6",
    apiKeyEnv: "ANTHROPIC_API_KEY",
  },
  {
    id: "gpt-5",
    name: "GPT-5.4",
    provider: "openai",
    protocol: "openai",
    endpoint: "https://api.openai.com",
    model: "gpt-5.4",
    apiKeyEnv: "OPENAI_API_KEY",
  },
];
