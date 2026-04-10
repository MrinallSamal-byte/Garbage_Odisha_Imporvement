"use client";

import { create } from "zustand";

import type { HomeFilters } from "@/lib/civic/types";

type HomeFiltersState = HomeFilters & {
  setFilters: (next: Partial<HomeFilters>) => void;
  hydrate: (next: HomeFilters) => void;
};

export const useHomeFiltersStore = create<HomeFiltersState>((set) => ({
  severity: "all",
  status: "all",
  view: "map",
  reportId: null,
  statsOpen: false,
  setFilters: (next) => set((current) => ({ ...current, ...next })),
  hydrate: (next) => set(() => next),
}));
