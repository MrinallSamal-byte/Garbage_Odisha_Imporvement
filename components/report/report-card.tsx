/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { MapPin, ThumbsUp, MessageSquare, ArrowRight } from "lucide-react";

import { StatusBadge, ModerationBadge } from "@/components/report/status-badge";
import { TrustScoreBadge } from "@/components/report/trust-score-badge";
import { cn } from "@/lib/utils/cn";
import type { ReportListItem } from "@/types/domain";

const severityColor: Record<string, string> = {
  LOW: "bg-emerald-400",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-rose-600",
};

const categoryLabel: Record<string, string> = {
  garbage: "Garbage",
  overflow: "Overflow",
  drain: "Drain",
  roadside_dump: "Roadside dump",
  mixed_waste: "Mixed waste",
  litter: "Litter",
  other: "Other",
};

export function ReportCard({
  item,
}: {
  item: ReportListItem & {
    media: Array<ReportListItem["media"][number] & { previewUrl?: string | null }>;
  };
}) {
  const leadImage = item.media[0];

  return (
    <Link href={`/reports/${item.report.id}`} className="group block">
      <article className="surface-card grid gap-0 overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-civic md:grid-cols-[200px_1fr]">
        <div className="relative overflow-hidden bg-slateblue-50">
          {leadImage?.previewUrl ? (
            <img
              src={leadImage.previewUrl}
              alt={item.report.description}
              className="h-[180px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] md:h-full"
              loading="lazy"
            />
          ) : (
            <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-slateblue-400 md:h-full">
              <MapPin className="h-8 w-8 opacity-40" />
              <span className="text-xs">No image</span>
            </div>
          )}
          <div className="absolute left-3 top-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur-sm",
                item.report.severity === "CRITICAL" || item.report.severity === "HIGH"
                  ? "text-rose-700"
                  : "text-slateblue-700",
              )}
            >
              <span
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  severityColor[item.report.severity] ?? "bg-slateblue-400",
                )}
              />
              {item.report.severity}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.report.status} />
            <ModerationBadge status={item.report.moderationStatus} />
            <TrustScoreBadge score={item.report.trustScore} />
            <span className="ml-auto text-xs font-medium uppercase tracking-[0.16em] text-slateblue-400">
              {categoryLabel[item.report.category] ?? item.report.category}
            </span>
          </div>

          <div>
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-ink">
              {item.report.description}
            </h3>
            <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-5 text-slateblue-600">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-civic-500" />
              <span className="line-clamp-1">{item.report.addressLine}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slateblue-600">
            {item.district?.name && (
              <span>
                <span className="font-semibold text-ink">District: </span>
                {item.district.name}
              </span>
            )}
            {item.assemblyConstituency?.name && (
              <span>
                <span className="font-semibold text-ink">Assembly: </span>
                {item.assemblyConstituency.name}
              </span>
            )}
            {item.mla?.name && (
              <span>
                <span className="font-semibold text-ink">MLA: </span>
                {item.mla.name}
              </span>
            )}
            {item.mp?.name && (
              <span>
                <span className="font-semibold text-ink">MP: </span>
                {item.mp.name}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 border-t border-slateblue-50 pt-3">
            <div className="flex items-center gap-4 text-xs text-slateblue-500">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" />
                {item.votes}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {item.comments}
              </span>
              <span>
                {new Date(item.report.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-civic-600 transition group-hover:gap-2">
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
