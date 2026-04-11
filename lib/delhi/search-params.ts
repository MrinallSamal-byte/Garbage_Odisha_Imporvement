import {
  delhiSeverities,
  delhiStatuses,
  delhiViews,
  delhiWasteTypes,
} from "@/lib/delhi/constants";
import type { DelhiFilters, DelhiSeverity, DelhiStatus, DelhiView, DelhiWasteType } from "@/lib/delhi/types";

function pickString(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function pickEnum<T extends string>(value: string, allowed: readonly T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function pickOptionalEnum<T extends string>(value: string, allowed: readonly T[]) {
  if (!value || value === "all") {
    return "all" as const;
  }

  return allowed.includes(value as T) ? (value as T) : "all";
}

export function parseDelhiFilters(params: Record<string, string | string[] | undefined>): DelhiFilters {
  return {
    view: pickEnum<DelhiView>(pickString(params.view), delhiViews, "map"),
    severity: pickOptionalEnum<DelhiSeverity>(pickString(params.severity), delhiSeverities),
    status: pickOptionalEnum<DelhiStatus>(pickString(params.status), delhiStatuses),
    wasteType: pickOptionalEnum<DelhiWasteType>(pickString(params.wasteType), delhiWasteTypes),
    authority: pickString(params.authority),
    ward: pickString(params.ward),
    mla: pickString(params.mla),
    mp: pickString(params.mp),
    q: pickString(params.q),
  };
}

export function buildDelhiQueryString(
  filters: DelhiFilters,
  overrides: Partial<DelhiFilters> = {},
) {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.view !== "map") {
    params.set("view", next.view);
  }

  if (next.severity !== "all") {
    params.set("severity", next.severity);
  }

  if (next.status !== "all") {
    params.set("status", next.status);
  }

  if (next.wasteType !== "all") {
    params.set("wasteType", next.wasteType);
  }

  for (const key of ["authority", "ward", "mla", "mp", "q"] as const) {
    if (next[key]) {
      params.set(key, next[key]);
    }
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}
