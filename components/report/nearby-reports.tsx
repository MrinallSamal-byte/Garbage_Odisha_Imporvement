"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";

import { StatusBadge } from "@/components/report/status-badge";
import { Card } from "@/components/ui/card";
import { readApiResponse } from "@/lib/utils/api-client";
import type { ReportListItem } from "@/types/domain";

type NearbyItem = ReportListItem & {
  media: Array<ReportListItem["media"][number] & { previewUrl?: string | null }>;
  distanceMeters: number;
};

type ApiResponse = {
  items: NearbyItem[];
};

export function NearbyReports({ reportId }: { reportId: string }) {
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/${reportId}/nearby`)
      .then((res) => readApiResponse<ApiResponse>(res))
      .then((data) => setItems(data.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) {
    return (
      <Card className="flex items-center gap-3 py-5 text-sm text-slateblue-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Looking for nearby reports…
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">Nearby reports</h2>
        <span className="text-xs text-slateblue-500">within 2 km</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.report.id}
            href={`/reports/${item.report.id}`}
            className="group flex items-start gap-3 rounded-[1.25rem] border border-slateblue-100 bg-slateblue-50/50 px-4 py-3 transition hover:bg-slateblue-50"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-civic-500" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.report.status} />
                <span className="text-xs font-semibold text-amber-600">
                  {item.distanceMeters < 1000
                    ? `${item.distanceMeters} m away`
                    : `${(item.distanceMeters / 1000).toFixed(1)} km away`}
                </span>
              </div>
              <p className="line-clamp-1 text-sm font-medium text-ink">{item.report.description}</p>
              <p className="line-clamp-1 text-xs text-slateblue-500">{item.report.addressLine}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slateblue-300 transition group-hover:text-civic-500" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
