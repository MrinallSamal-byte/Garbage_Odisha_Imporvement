import { Badge } from "@/components/ui/badge";
import type { ModerationStatus, ReportStatus } from "@/types/domain";

const statusVariantMap: Record<ReportStatus, "civic" | "warning" | "success" | "danger" | "neutral"> = {
  REPORTED: "warning",
  VERIFIED: "civic",
  FORWARDED: "neutral",
  IN_PROGRESS: "civic",
  RESOLVED: "success",
  REJECTED: "danger",
  DUPLICATE: "neutral",
};

const moderationVariantMap: Record<ModerationStatus, "neutral" | "success" | "danger" | "warning"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  NEEDS_REVIEW: "neutral",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return <Badge variant={statusVariantMap[status]}>{status.replaceAll("_", " ")}</Badge>;
}

export function ModerationBadge({ status }: { status: ModerationStatus }) {
  return <Badge variant={moderationVariantMap[status]}>{status.replaceAll("_", " ")}</Badge>;
}
