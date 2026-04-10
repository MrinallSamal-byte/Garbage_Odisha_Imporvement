import { env } from "@/lib/env";
import { OpenRouterImageAnalysisProvider } from "@/lib/ai/providers/openrouter-image-analysis-provider";
import { MockImageAnalysisProvider } from "@/lib/ai/providers/mock-image-analysis-provider";
import { OpenAiImageAnalysisProvider } from "@/lib/ai/providers/openai-image-analysis-provider";
import type { AnalyzeReportInput, ReportAiSummary, ReverseGeocodeResult } from "@/types/domain";

export interface AnalyzeImageContext {
  imageBase64: string;
  mimeType: string;
  reverseGeocodeResult: ReverseGeocodeResult;
  reportInput: Omit<AnalyzeReportInput, "imageBase64" | "mimeType" | "fileName" | "fileSize">;
}

export interface ImageAnalysisProvider {
  analyze(context: AnalyzeImageContext): Promise<ReportAiSummary>;
}

let provider: ImageAnalysisProvider | null = null;

function getProvider() {
  if (!provider) {
    provider =
      env.AI_PROVIDER === "openai"
        ? new OpenAiImageAnalysisProvider()
        : env.AI_PROVIDER === "openrouter"
          ? new OpenRouterImageAnalysisProvider()
          : new MockImageAnalysisProvider();
  }

  return provider;
}

export async function analyzeCapturedReportImage(context: AnalyzeImageContext) {
  // The provider already returns a strongly-typed, validated ReportAiSummary.
  // OpenAI and OpenRouter providers parse through reportAiSummarySchema internally;
  // the mock provider returns statically valid data. Returning directly avoids a
  // redundant camelCase→snake_case→camelCase round-trip that could silently
  // swallow schema mismatches and makes the code harder to follow.
  return getProvider().analyze(context);
}
