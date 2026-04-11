"use client";

import dynamic from "next/dynamic";

import { MapSkeleton } from "@/components/ui/skeleton";

export const LazyDelhiMap = dynamic(
  () => import("@/components/delhi/delhi-map").then((module) => module.DelhiMap),
  {
    ssr: false,
    loading: () => <MapSkeleton height={520} />,
  },
);
