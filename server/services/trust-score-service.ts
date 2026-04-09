import type { DuplicateDetectionResult, ReportAiSummary, SourceType } from "@/types/domain";

type TrustScoreInput = {
  sourceType: SourceType;
  gpsAccuracyMeters: number;
  aiSummary: ReportAiSummary;
  duplicateDetection: DuplicateDetectionResult;
  rateLimitRisk?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function computeTrustScore(input: TrustScoreInput) {
  let score = 0;
  const notes: string[] = [];

  score += input.sourceType === "LIVE_CAPTURE" ? 35 : input.sourceType === "GALLERY_UPLOAD" ? 22 : 12;

  if (input.gpsAccuracyMeters <= 10) {
    score += 24;
  } else if (input.gpsAccuracyMeters <= 35) {
    score += 18;
  } else if (input.gpsAccuracyMeters <= 75) {
    score += 10;
    notes.push("GPS accuracy is usable but weaker than ideal.");
  } else if (input.gpsAccuracyMeters <= 150) {
    score -= 8;
    notes.push("GPS accuracy is poor and requires moderator attention.");
  } else {
    score -= 24;
    notes.push("GPS accuracy is too weak for a high-trust automatic path.");
  }

  score += Math.round(input.aiSummary.confidenceScore * 18);

  if (input.aiSummary.gpsImageConsistency === "high") {
    score += 10;
  } else if (input.aiSummary.gpsImageConsistency === "medium") {
    score += 4;
  } else {
    score -= 16;
    notes.push("Image clues do not strongly match the GPS-derived area.");
  }

  if (!input.aiSummary.issueDetected) {
    score -= 14;
    notes.push("AI could not confidently identify a cleanliness issue.");
  }

  if (input.aiSummary.suspiciousFlag) {
    score -= 12;
    notes.push("AI flagged this report for closer moderation.");
  }

  if (input.duplicateDetection.sameImageMatches.length > 0) {
    score -= 28;
    notes.push("The same image hash appears in earlier reports.");
  }

  if (input.duplicateDetection.nearbyMatches.length > 0) {
    score -= 8;
    notes.push("A nearby report was submitted recently.");
  }

  if (input.duplicateDetection.sessionMatches.length > 2) {
    score -= 10;
    notes.push("Repeated submissions from the same session were detected.");
  }

  if (input.rateLimitRisk) {
    score -= 8;
    notes.push("Submission activity is unusually high for this client session.");
  }

  return {
    score: clamp(score, 0, 100),
    notes,
  };
}
