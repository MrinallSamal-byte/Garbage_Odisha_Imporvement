import Link from "next/link";
import { CalendarDays, MapPinned, UsersRound } from "lucide-react";

import { DelhiSeverityBadge, DelhiStatusBadge } from "@/components/delhi/severity-status-badges";
import { Card } from "@/components/ui/card";
import { wasteTypeLabels } from "@/lib/delhi/constants";
import type { DelhiReportCard as DelhiReportCardType } from "@/lib/delhi/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DelhiReportCard({ report }: { report: DelhiReportCardType }) {
  const wardLabel = report.ward.number
    ? `Ward ${report.ward.number}${report.ward.name ? ` - ${report.ward.name}` : ""}`
    : report.authority.name ?? "Jurisdiction pending";

  return (
    <Link href={`/report/${report.id}`} className="block transition hover:-translate-y-0.5">
      <Card className="grid gap-4 overflow-hidden p-4 md:grid-cols-[160px_1fr]">
        <div className="h-36 overflow-hidden rounded-[1.4rem] bg-slateblue-100 md:h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.thumbnailUrl ?? report.photoUrl}
            alt={report.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <DelhiSeverityBadge severity={report.severity} />
            <DelhiStatusBadge status={report.status} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-ink">{report.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slateblue-700">{report.addressText}</p>
          </div>
          <div className="grid gap-2 text-sm text-slateblue-700 sm:grid-cols-2">
            <span className="inline-flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-civic-600" />
              {report.reporterCount} citizen report{report.reporterCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-civic-600" />
              {formatDate(report.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-civic-600" />
              {wardLabel}
            </span>
            <span>
              {wasteTypeLabels[report.wasteType]} - MLA: {report.mla?.name ?? "pending"}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
