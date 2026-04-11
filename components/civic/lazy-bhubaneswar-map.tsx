"use client";

import dynamic from "next/dynamic";

import { MapSkeleton } from "@/components/ui/skeleton";

export const LazyBhubaneswarMap = dynamic(
  () => import("@/components/civic/bhubaneswar-map").then((module) => module.BhubaneswarMap),
  {
    ssr: false,
    loading: () => <MapSkeleton height={520} />,
  },
);
