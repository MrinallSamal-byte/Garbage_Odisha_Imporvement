import { describe, expect, it } from "vitest";

import { computeTrustScore } from "@/server/services/trust-score-service";

describe("trust score service", () => {
  it("gives live capture with good GPS and no duplicates a high score", () => {
    const result = computeTrustScore({
      sourceType: "LIVE_CAPTURE",
      gpsAccuracyMeters: 9,
      aiSummary: {
        issueDetected: true,
        issueType: "overflow",
        confidenceScore: 0.92,
        visibleLandmarks: [],
        detectedText: [],
        languageDetected: "english",
        likelyEnvironment: "market",
        garbageSeverity: "high",
        gpsImageConsistency: "high",
        suspiciousFlag: false,
        moderationNotes: "",
        localityClues: ["Nayapalli"],
      },
      duplicateDetection: {
        suspicious: false,
        sameImageMatches: [],
        nearbyMatches: [],
        sessionMatches: [],
        notes: [],
      },
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("reduces score for suspicious duplicates and poor GPS", () => {
    const result = computeTrustScore({
      sourceType: "GALLERY_UPLOAD",
      gpsAccuracyMeters: 220,
      aiSummary: {
        issueDetected: false,
        issueType: "other",
        confidenceScore: 0.22,
        visibleLandmarks: [],
        detectedText: [],
        languageDetected: "unknown",
        likelyEnvironment: "unknown",
        garbageSeverity: "low",
        gpsImageConsistency: "low",
        suspiciousFlag: true,
        moderationNotes: "",
        localityClues: [],
      },
      duplicateDetection: {
        suspicious: true,
        sameImageMatches: [{ reportId: "1", reportCode: "SOD-1", createdAt: "2026-04-09T00:00:00Z" }],
        nearbyMatches: [{ reportId: "2", reportCode: "SOD-2", distanceMeters: 18 }],
        sessionMatches: [{ reportId: "3", reportCode: "SOD-3", createdAt: "2026-04-09T00:00:00Z" }],
        notes: [],
      },
    });

    expect(result.score).toBeLessThan(40);
  });
});
