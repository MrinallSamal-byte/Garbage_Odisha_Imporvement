"use client";

import { useRouter } from "next/navigation";
import { List, Map as MapIcon } from "lucide-react";

import { reportSeverities, reportStatuses, severityLabels, statusLabels } from "@/lib/civic/constants";
import { buildHomeQuery } from "@/lib/civic/search-params";
import type { HomeFilters } from "@/lib/civic/types";
import { cn } from "@/lib/utils/cn";

function buildHref(filters: HomeFilters, overrides: Partial<HomeFilters> = {}) {
  const query = buildHomeQuery({ ...filters, ...overrides });
  return query ? `/?${query}` : "/";
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 pr-7 text-xs font-medium text-gray-600 outline-none transition focus:border-red-200 focus:ring-2 focus:ring-red-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function HomeFilterControls({ filters }: { filters: HomeFilters }) {
  const router = useRouter();
  const severityOptions = [
    { value: "all", label: "All Severity" },
    ...reportSeverities.map((severity) => ({ value: severity, label: severityLabels[severity] })),
  ];
  const statusOptions = [
    { value: "all", label: "All Status" },
    ...reportStatuses.map((status) => ({ value: status, label: statusLabels[status] })),
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Severity"
          value={filters.severity}
          options={severityOptions}
          onChange={(severity) => router.push(buildHref(filters, { severity: severity as HomeFilters["severity"] }))}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          options={statusOptions}
          onChange={(status) => router.push(buildHref(filters, { status: status as HomeFilters["status"] }))}
        />
      </div>

      <div className="ml-auto inline-flex shrink-0 rounded-lg border border-gray-100 bg-gray-50 p-0.5">
        <button
          type="button"
          onClick={() => router.push(buildHref(filters, { view: "map" }))}
          className={cn(
            "inline-flex h-7 items-center rounded-md px-3 text-[11px] font-semibold transition",
            filters.view === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400",
          )}
        >
          <MapIcon className="mr-1.5 h-3.5 w-3.5" />
          Map
        </button>
        <button
          type="button"
          onClick={() => router.push(buildHref(filters, { view: "list" }))}
          className={cn(
            "inline-flex h-7 items-center rounded-md px-3 text-[11px] font-semibold transition",
            filters.view === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400",
          )}
        >
          <List className="mr-1.5 h-3.5 w-3.5" />
          List
        </button>
      </div>
    </div>
  );
}
