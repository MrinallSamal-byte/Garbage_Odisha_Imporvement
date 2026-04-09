import { getStorageAdapter } from "@/lib/storage/storage-adapter";
import type { ReportDetail, ReportListItem } from "@/types/domain";

function getSafePreviewUrl(storageKey: string) {
  try {
    return getStorageAdapter().getPublicUrl(storageKey);
  } catch (error) {
    console.error("Could not resolve media preview URL", error);
    return null;
  }
}

export function serializeReportListItem(item: ReportListItem) {
  return {
    ...item,
    media: item.media.map((asset) => ({
      ...asset,
      previewUrl: getSafePreviewUrl(asset.storageKey),
    })),
  };
}

export function serializeReportDetail(detail: ReportDetail) {
  return {
    ...detail,
    media: detail.media.map((asset) => ({
      ...asset,
      previewUrl: getSafePreviewUrl(asset.storageKey),
    })),
  };
}
