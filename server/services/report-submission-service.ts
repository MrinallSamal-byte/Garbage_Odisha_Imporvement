import path from "path";

import { getStorageAdapter } from "@/lib/storage/storage-adapter";
import { AppError } from "@/lib/utils/errors";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { deletePreviewSession, readPreviewSession } from "@/server/workflows/preview-session-store";

export async function submitPreviewedReport(input: {
  previewToken: string;
  description: string;
  anonymousFlag: boolean;
  createdByUserId?: string | null;
}) {
  const preview = await readPreviewSession(input.previewToken);

  if (!preview) {
    throw new AppError("Preview session not found or expired.", 404);
  }

  if (Date.parse(preview.expiresAt) < Date.now()) {
    await deletePreviewSession(input.previewToken);
    throw new AppError("Preview session has expired. Please analyze the report again.", 410);
  }

  const storage = getStorageAdapter();
  const extension = path.extname(preview.input.fileName) || ".jpg";
  const finalStorageKey = `reports/${new Date().toISOString().slice(0, 10)}/${input.previewToken}${extension}`;
  await storage.copyObject(preview.media.tempStorageKey, finalStorageKey);
  await storage.deleteObject(preview.media.tempStorageKey);

  const reportRepository = getReportRepository();
  const detail = await reportRepository.createReportFromPreview({
    preview,
    description: input.description,
    anonymousFlag: input.anonymousFlag,
    createdByUserId: input.createdByUserId ?? null,
    finalStorageKey,
  });

  await deletePreviewSession(input.previewToken);
  return detail;
}
