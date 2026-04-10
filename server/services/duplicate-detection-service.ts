import type { DuplicateDetectionResult } from "@/types/domain";

import { getReportRepository } from "@/server/repositories/repository-factory";

export async function detectDuplicateReports(input: {
  sha256Hash: string;
  latitude: number;
  longitude: number;
  sessionFingerprintHash?: string | null;
}) {
  const reportRepository = getReportRepository();
  const candidates = await reportRepository.findDuplicateCandidates(input);

  const notes: string[] = [];
  if (candidates.sameImageMatches.length > 0) {
    notes.push("Image hash has been seen before.");
  }

  if (candidates.nearbyMatches.length > 0) {
    notes.push("There are recent nearby reports that may represent the same issue.");
  }

  if (candidates.sessionMatches.length > 2) {
    notes.push("The same session has submitted multiple recent reports.");
  }

  const result: DuplicateDetectionResult = {
    suspicious:
      candidates.sameImageMatches.length > 0 ||
      candidates.nearbyMatches.length > 0 ||
      candidates.sessionMatches.length > 2,
    sameImageMatches: candidates.sameImageMatches.map((item) => ({
      reportId: item.report.id,
      reportCode: item.report.reportCode,
      createdAt: item.report.createdAt,
    })),
    nearbyMatches: candidates.nearbyMatches.map((item) => ({
      reportId: item.report.id,
      reportCode: item.report.reportCode,
      distanceMeters: item.distanceMeters,
    })),
    sessionMatches: candidates.sessionMatches.map((item) => ({
      reportId: item.report.id,
      reportCode: item.report.reportCode,
      createdAt: item.report.createdAt,
    })),
    notes,
  };

  return result;
}
