export type ProviderType = "ollama" | "ollama-cloud" | "gemini" | "openai" | "anthropic" | "custom";

export interface ResolvedModel {
  modelTag: string;
  modelName: string;
  providerType: ProviderType;
  baseUrl: string | null;
  apiKey?: string | undefined;
}
