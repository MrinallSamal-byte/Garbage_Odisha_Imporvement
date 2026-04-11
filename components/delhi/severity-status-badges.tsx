import {
  severityBadgeClasses,
  severityLabels,
  statusBadgeClasses,
  statusLabels,
} from "@/lib/delhi/constants";
import type { DelhiSeverity, DelhiStatus } from "@/lib/delhi/types";
import { cn } from "@/lib/utils/cn";

export function DelhiSeverityBadge({ severity }: { severity: DelhiSeverity }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]",
        severityBadgeClasses[severity],
      )}
    >
      {severityLabels[severity]}
    </span>
  );
}

export function DelhiStatusBadge({ status }: { status: DelhiStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]",
        statusBadgeClasses[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
