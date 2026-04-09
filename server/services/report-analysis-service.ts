import { addMinutes } from "date-fns";

import { analyzeCapturedReportImage } from "@/lib/ai/report-image-analyzer";
import { getReverseGeocoder } from "@/lib/geo/reverse-geocoder";
import { getStorageAdapter } from "@/lib/storage/storage-adapter";
import { AppError } from "@/lib/utils/errors";
import type { AnalyzeReportInput, AnalyzeReportResult } from "@/types/domain";
import { detectDuplicateReports } from "@/server/services/duplicate-detection-service";
import { isPointInsideOdisha, lookupRepresentativesByPoint } from "@/server/services/spatial-lookup-service";
import { computeTrustScore } from "@/server/services/trust-score-service";
import { createPreviewSession } from "@/server/workflows/preview-session-store";

type ProcessedImagePayload = {
  buffer: Buffer;
  mimeType: string;
  width: number | null;
  height: number | null;
  fileSize: number;
  sha256Hash: string;
  exifJson: Record<string, unknown> | null;
  normalizedFilename: string;
};

export async function analyzeIncomingReport(
  input: Omit<AnalyzeReportInput, "imageBase64" | "mimeType" | "fileName" | "fileSize">,
  processedImage: ProcessedImagePayload,
): Promise<AnalyzeReportResult> {
  const insideOdisha = await isPointInsideOdisha(input.latitude, input.longitude);

  if (!insideOdisha) {
    throw new AppError("This platform currently accepts reports only within Odisha.", 400);
  }

  const reverseGeocoder = getReverseGeocoder();
  const address = await reverseGeocoder.reverseGeocode(input.latitude, input.longitude);
  const lookup = await lookupRepresentativesByPoint(input.latitude, input.longitude);
  const aiSummary = await analyzeCapturedReportImage({
    imageBase64: processedImage.buffer.toString("base64"),
    mimeType: processedImage.mimeType,
    reverseGeocodeResult: address,
    reportInput: {
      latitude: input.latitude,
      longitude: input.longitude,
      gpsAccuracyMeters: input.gpsAccuracyMeters,
      captureTimestamp: input.captureTimestamp,
      description: input.description,
      sourceType: input.sourceType,
      sessionFingerprintHash: input.sessionFingerprintHash ?? null,
    },
  });

  const duplicateDetection = await detectDuplicateReports({
    sha256Hash: processedImage.sha256Hash,
    latitude: input.latitude,
    longitude: input.longitude,
    sessionFingerprintHash: input.sessionFingerprintHash ?? null,
  });

  const trustScore = computeTrustScore({
    sourceType: input.sourceType,
    gpsAccuracyMeters: input.gpsAccuracyMeters,
    aiSummary,
    duplicateDetection,
  });

  const storage = getStorageAdapter();
  const tempStorageKey = `tmp/previews/${Date.now()}-${processedImage.sha256Hash.slice(0, 16)}.jpg`;
  const mediaPreview = await storage.saveBuffer({
    buffer: processedImage.buffer,
    storageKey: tempStorageKey,
    contentType: processedImage.mimeType,
  });

  const reviewNotes = [
    ...lookup.reviewNotes,
    ...trustScore.notes,
    ...duplicateDetection.notes,
  ];

  const previewToken = await createPreviewSession({
    createdAt: new Date().toISOString(),
    expiresAt: addMinutes(new Date(), 30).toISOString(),
    input: {
      imageBase64: "",
      mimeType: processedImage.mimeType,
      fileName: processedImage.normalizedFilename,
      fileSize: processedImage.fileSize,
      latitude: input.latitude,
      longitude: input.longitude,
      gpsAccuracyMeters: input.gpsAccuracyMeters,
      captureTimestamp: input.captureTimestamp,
      description: input.description,
      sourceType: input.sourceType,
      sessionFingerprintHash: input.sessionFingerprintHash ?? null,
    },
    address,
    lookup,
    aiSummary,
    duplicateDetection,
    trustScore: trustScore.score,
    media: {
      tempStorageKey,
      sha256Hash: processedImage.sha256Hash,
      width: processedImage.width,
      height: processedImage.height,
      exifJson: processedImage.exifJson,
    },
    reviewNotes,
  });

  return {
    previewToken,
    address,
    insideOdisha,
    district: lookup.district,
    assemblyConstituency: lookup.assemblyConstituency,
    parliamentConstituency: lookup.parliamentConstituency,
    mla: lookup.mla,
    mp: lookup.mp,
    aiSummary,
    trustScore: trustScore.score,
    duplicateDetection,
    reviewNotes,
    mediaPreviewUrl: mediaPreview.publicUrl,
  };
}
