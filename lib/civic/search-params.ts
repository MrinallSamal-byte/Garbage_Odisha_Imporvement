import { homeViews, reportSeverities, reportStatuses } from "@/lib/civic/constants";
import type { HomeFilters } from "@/lib/civic/types";

function includes<T extends readonly string[]>(values: T, candidate: string | null | undefined): candidate is T[number] {
  return Boolean(candidate && values.includes(candidate));
}

export function parseHomeFilters(input: Record<string, string | string[] | undefined>): HomeFilters {
  const severity = Array.isArray(input.severity) ? input.severity[0] : input.severity;
  const status = Array.isArray(input.status) ? input.status[0] : input.status;
  const view = Array.isArray(input.view) ? input.view[0] : input.view;
  const report = Array.isArray(input.report) ? input.report[0] : input.report;
  const stats = Array.isArray(input.stats) ? input.stats[0] : input.stats;

  return {
    severity: includes(reportSeverities, severity) ? severity : "all",
    status: includes(reportStatuses, status) ? status : "all",
    view: includes(homeViews, view) ? view : "map",
    reportId: report ?? null,
    statsOpen: stats === "1",
  };
}

export function buildHomeQuery(filters: HomeFilters) {
  const params = new URLSearchParams();

  if (filters.severity !== "all") {
    params.set("severity", filters.severity);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.view !== "map") {
    params.set("view", filters.view);
  }

  if (filters.reportId) {
    params.set("report", filters.reportId);
  }

  if (filters.statsOpen) {
    params.set("stats", "1");
  }

  return params.toString();
}
