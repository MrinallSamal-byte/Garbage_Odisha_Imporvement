"use client";

import dynamic from "next/dynamic";

export const LazyReportsMap = dynamic(
  () => import("@/components/maps/reports-map").then((module) => module.ReportsMap),
  {
    ssr: false,
    loading: () => (
      <div className="surface-card flex h-[320px] items-center justify-center text-sm text-slateblue-600">
        Loading map...
      </div>
    ),
  },
);
