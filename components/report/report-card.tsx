/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { StatusBadge, ModerationBadge } from "@/components/report/status-badge";
import { TrustScoreBadge } from "@/components/report/trust-score-badge";
import type { ReportListItem } from "@/types/domain";

export function ReportCard({
  item,
}: {
  item: ReportListItem & { media: Array<ReportListItem["media"][number] & { previewUrl?: string | null }> };
}) {
  const leadImage = item.media[0];

  return (
    <Card className="grid gap-5 md:grid-cols-[220px_1fr]">
      <div className="overflow-hidden rounded-[1.5rem] border border-slateblue-100 bg-slateblue-50">
        {leadImage?.previewUrl ? (
          <img
            src={leadImage.previewUrl}
            alt={item.report.description}
            className="h-full min-h-[200px] w-full object-cover"
          />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-slateblue-500">
            No image
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={item.report.status} />
          <ModerationBadge status={item.report.moderationStatus} />
          <TrustScoreBadge score={item.report.trustScore} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-ink">{item.report.description}</h3>
          <p className="mt-2 text-sm leading-6 text-slateblue-700">
            {item.report.addressLine}
          </p>
        </div>
        <div className="grid gap-2 text-sm text-slateblue-700 md:grid-cols-2">
          <div>
            <span className="font-semibold text-ink">District:</span> {item.district?.name ?? "Unknown"}
          </div>
          <div>
            <span className="font-semibold text-ink">Assembly:</span>{" "}
            {item.assemblyConstituency?.name ?? "Unmapped"}
          </div>
          <div>
            <span className="font-semibold text-ink">Parliament:</span>{" "}
            {item.parliamentConstituency?.name ?? "Unmapped"}
          </div>
          <div>
            <span className="font-semibold text-ink">Support:</span> {item.votes} votes
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slateblue-500">
            {new Date(item.report.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <Link
            href={`/reports/${item.report.id}`}
            className="inline-flex rounded-full border border-civic-100 bg-civic-50 px-4 py-2 text-sm font-semibold text-civic-700 transition hover:bg-civic-100"
          >
            View report
          </Link>
        </div>
      </div>
    </Card>
  );
}
