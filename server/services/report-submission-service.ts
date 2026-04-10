import path from "path";

import { getStorageAdapter } from "@/lib/storage/storage-adapter";
import { AppError } from "@/lib/utils/errors";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { deletePreviewSession, readPreviewSession } from "@/server/workflows/preview-session-store";

function toIssueLabel(value: string) {
  return value.replace(/_/g, " ");
}

function resolveSubmittedDescription(
  preview: Awaited<ReturnType<typeof readPreviewSession>>,
  rawDescription: string,
) {
  const description = rawDescription.trim();

  if (description.length >= 5) {
    return description;
  }

  const previewDescription = preview?.input.description?.trim() ?? "";
  if (previewDescription.length >= 5) {
    return previewDescription;
  }

  const issueLabel = toIssueLabel(preview?.aiSummary.issueType ?? "cleanliness");
  const locality =
    preview?.address.locality ??
    preview?.lookup.assemblyConstituency?.name ??
    preview?.lookup.district?.name ??
    "the reported location";

  return `Reported ${issueLabel} issue near ${locality}.`;
}

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
  const resolvedDescription = resolveSubmittedDescription(preview, input.description);

  await storage.copyObject(preview.media.tempStorageKey, finalStorageKey);

  const reportRepository = getReportRepository();

  let detail;

  try {
    detail = await reportRepository.createReportFromPreview({
      preview,
      description: resolvedDescription,
      anonymousFlag: input.anonymousFlag,
      createdByUserId: input.createdByUserId ?? null,
      finalStorageKey,
    });
  } catch (error) {
    await storage.deleteObject(finalStorageKey).catch(() => undefined);
    throw error;
  }

  const cleanupResults = await Promise.allSettled([
    storage.deleteObject(preview.media.tempStorageKey),
    deletePreviewSession(input.previewToken),
  ]);

  if (cleanupResults[0].status === "rejected") {
    console.error("Could not remove temporary preview media after submission", cleanupResults[0].reason);
  }

  if (cleanupResults[1].status === "rejected") {
    console.error("Could not remove preview session after submission", cleanupResults[1].reason);
  }

  return detail;
}
