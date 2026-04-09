import { env } from "@/lib/env";
import { normalizeForMatch } from "@/lib/utils/text";
import type { ReportAiSummary } from "@/types/domain";

import type { AnalyzeImageContext, ImageAnalysisProvider } from "@/lib/ai/report-image-analyzer";

const issueKeywords: Array<{ keyword: string; issue: ReportAiSummary["issueType"] }> = [
  { keyword: "overflow", issue: "overflow" },
  { keyword: "drain", issue: "drain" },
  { keyword: "dump", issue: "roadside_dump" },
  { keyword: "litter", issue: "litter" },
  { keyword: "waste", issue: "mixed_waste" },
  { keyword: "garbage", issue: "garbage" },
];

function detectIssueType(description: string) {
  for (const entry of issueKeywords) {
    if (description.includes(entry.keyword)) {
      return entry.issue;
    }
  }

  return "other";
}

function detectLanguage(description: string): ReportAiSummary["languageDetected"] {
  if (/[\u0B00-\u0B7F]/.test(description)) {
    return /[a-z]/i.test(description) ? "mixed" : "odia";
  }

  return description.length > 0 ? "english" : "unknown";
}

export class MockImageAnalysisProvider implements ImageAnalysisProvider {
  async analyze(context: AnalyzeImageContext): Promise<ReportAiSummary> {
    const normalizedDescription = normalizeForMatch(context.reportInput.description);
    const issueType = detectIssueType(normalizedDescription);
    const issueDetected = issueType !== "other" || context.imageBase64.length > 1000;
    const locality = context.reverseGeocodeResult.locality ?? context.reverseGeocodeResult.districtName ?? "Odisha";

    const consistency =
      normalizedDescription.includes(normalizeForMatch(locality)) ||
      normalizedDescription.includes(normalizeForMatch(context.reverseGeocodeResult.districtName))
        ? "high"
        : context.reportInput.gpsAccuracyMeters <= env.GPS_ACCURACY_WARN_THRESHOLD
          ? "medium"
          : "low";

    return {
      issueDetected,
      issueType,
      confidenceScore: issueDetected ? 0.66 : 0.34,
      visibleLandmarks: locality ? [`streetscape near ${locality}`] : [],
      detectedText: locality ? [locality] : [],
      languageDetected: detectLanguage(context.reportInput.description ?? ""),
      likelyEnvironment:
        context.reverseGeocodeResult.addressLine.toLowerCase().includes("market")
          ? "market"
          : context.reverseGeocodeResult.addressLine.toLowerCase().includes("road")
            ? "roadside"
            : "public_space",
      garbageSeverity:
        issueType === "overflow" || normalizedDescription.includes("huge") ? "high" : "medium",
      gpsImageConsistency: consistency,
      suspiciousFlag: !issueDetected || consistency === "low",
      moderationNotes:
        "Mock AI mode is active. This summary is generated from metadata and text heuristics, not true multimodal vision inspection.",
      localityClues: [locality].filter(Boolean),
    };
  }
}
