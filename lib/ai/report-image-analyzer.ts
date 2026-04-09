import "server-only";

import { env } from "@/lib/env";
import { reportAiSummarySchema } from "@/lib/ai/schema";
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

function mapPayloadToDomain(payload: ReturnType<typeof reportAiSummarySchema.parse>): ReportAiSummary {
  return {
    issueDetected: payload.issue_detected,
    issueType: payload.issue_type,
    confidenceScore: payload.confidence_score,
    visibleLandmarks: payload.visible_landmarks,
    detectedText: payload.detected_text,
    languageDetected: payload.language_detected,
    likelyEnvironment: payload.likely_environment,
    garbageSeverity: payload.garbage_severity,
    gpsImageConsistency: payload.gps_image_consistency,
    suspiciousFlag: payload.suspicious_flag,
    moderationNotes: payload.moderation_notes,
    localityClues: payload.locality_clues,
  };
}

function getProvider() {
  if (!provider) {
    provider =
      env.AI_PROVIDER === "openai" ? new OpenAiImageAnalysisProvider() : new MockImageAnalysisProvider();
  }

  return provider;
}

export async function analyzeCapturedReportImage(context: AnalyzeImageContext) {
  const result = await getProvider().analyze(context);
  return mapPayloadToDomain(reportAiSummarySchema.parse({
    issue_detected: result.issueDetected,
    issue_type: result.issueType,
    confidence_score: result.confidenceScore,
    visible_landmarks: result.visibleLandmarks,
    detected_text: result.detectedText,
    language_detected: result.languageDetected,
    likely_environment: result.likelyEnvironment,
    garbage_severity: result.garbageSeverity,
    gps_image_consistency: result.gpsImageConsistency,
    suspicious_flag: result.suspiciousFlag,
    moderation_notes: result.moderationNotes,
    locality_clues: result.localityClues,
  }));
}
