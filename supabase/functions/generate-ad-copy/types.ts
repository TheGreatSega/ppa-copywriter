// Shared types for the ad copy generation system

export type Provider = "openai" | "gemini";

export type PlatformKey = "google" | "meta" | "x" | "tiktok";

export interface GenerateRequest {
  platform: PlatformKey;
  provider: Provider;
  model: string;
  locale?: string;
  temperature?: number;
  placement?: string;
  
  // Input content
  productContext?: string;
  audience?: string;
  tone?: string;
  keywords?: string[];
  
  // Existing assets (for reference)
  existingAssets?: {
    headlines?: string[];
    descriptions?: string[];
    primaryTexts?: string[];
  };
  
  // Generation limits
  limits?: {
    headlines?: number;
    descriptions?: number;
    primaryTexts?: number;
  };
}

export interface GenerateResult {
  headlines?: string[];
  descriptions?: string[];
  primaryTexts?: string[];
  tweets?: string[];
  adTexts?: string[];
}

export interface PlatformHandler {
  key: PlatformKey;
  systemPrompt: string;
  
  buildUserPrompt(req: GenerateRequest): string;
  
  openAISchema: object;
  geminiSchema: object;
  
  postprocess(raw: any, req: GenerateRequest): GenerateResult;
}
