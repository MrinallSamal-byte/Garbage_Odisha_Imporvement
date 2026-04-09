"use client";

import dynamic from "next/dynamic";

import { MapSkeleton } from "@/components/ui/skeleton";

export const LazyReportsMap = dynamic(
  () => import("@/components/maps/reports-map").then((m) => m.ReportsMap),
  {
    ssr: false,
    loading: () => <MapSkeleton height={320} />,
  },
);
