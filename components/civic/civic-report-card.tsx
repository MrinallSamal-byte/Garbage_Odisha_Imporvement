/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CalendarDays, MapPinned, UsersRound } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  severityBadgeClasses,
  severityLabels,
  statusBadgeClasses,
  statusLabels,
} from "@/lib/civic/constants";
import { formatWardLabel } from "@/lib/civic/map-view";
import type { ReportListItem } from "@/lib/civic/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CivicReportCard({ item }: { item: ReportListItem }) {
  return (
    <Link href={`/report/${item.report.id}`} className="block transition hover:-translate-y-0.5">
      <Card className="grid gap-4 overflow-hidden p-4 md:grid-cols-[160px_1fr]">
        <div className="h-36 overflow-hidden rounded-md bg-slateblue-100 md:h-full">
          <img
            src={item.report.photoUrl}
            alt={item.report.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${severityBadgeClasses[item.report.severity]}`}>
              {severityLabels[item.report.severity]}
            </span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusBadgeClasses[item.report.status]}`}>
              {statusLabels[item.report.status]}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-ink">{item.report.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slateblue-700">{item.report.address}</p>
          </div>
          <div className="grid gap-2 text-sm text-slateblue-700 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-civic-600" />
              {item.report.reporterCount} citizen report{item.report.reporterCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-civic-600" />
              {formatDate(item.report.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-civic-600" />
              {formatWardLabel(item.ward)}
            </span>
            <span>
              {item.wasteType.label} - MLA: {item.mla.name}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
