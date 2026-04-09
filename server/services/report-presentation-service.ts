import { getStorageAdapter } from "@/lib/storage/storage-adapter";
import type { ReportDetail, ReportListItem } from "@/types/domain";

export function serializeReportListItem(item: ReportListItem) {
  const storage = getStorageAdapter();

  return {
    ...item,
    media: item.media.map((asset) => ({
      ...asset,
      previewUrl: storage.getPublicUrl(asset.storageKey),
    })),
  };
}

export function serializeReportDetail(detail: ReportDetail) {
  const storage = getStorageAdapter();

  return {
    ...detail,
    media: detail.media.map((asset) => ({
      ...asset,
      previewUrl: storage.getPublicUrl(asset.storageKey),
    })),
  };
}
