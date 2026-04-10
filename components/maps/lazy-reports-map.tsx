"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

import { MapSkeleton } from "@/components/ui/skeleton";

// Load Leaflet only on the client — it depends on `window`.
const ReportsMapDynamic = dynamic(
  () => import("@/components/maps/reports-map").then((m) => m.ReportsMap),
  { ssr: false },
);

type MarkerItem = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string | null;
};

/**
 * Drop-in replacement for ReportsMap that:
 * 1. Never SSR-renders Leaflet (avoids `window` errors).
 * 2. Shows a skeleton at the CORRECT height while loading, eliminating the
 *    layout shift that occurred when the old static `loading: () => <MapSkeleton height={320} />`
 *    was used with map instances sized at 80 px, 160 px, 340 px, or 360 px.
 */
export function LazyReportsMap({
  markers,
  height = 320,
}: {
  markers: MarkerItem[];
  height?: number;
}) {
  return (
    <Suspense fallback={<MapSkeleton height={height} />}>
      <ReportsMapDynamic markers={markers} height={height} />
    </Suspense>
  );
}
