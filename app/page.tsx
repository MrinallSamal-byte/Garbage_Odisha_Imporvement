import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, List, Map as MapIcon, Plus } from "lucide-react";

import { DelhiReportCard } from "@/components/delhi/delhi-report-card";
import { LazyDelhiMap } from "@/components/delhi/lazy-delhi-map";
import {
  delhiSeverities,
  delhiStatuses,
  severityLabels,
  statusLabels,
} from "@/lib/delhi/constants";
import { getDelhiHomeData } from "@/lib/delhi/repository";
import { buildDelhiQueryString, parseDelhiFilters } from "@/lib/delhi/search-params";
import type { DelhiFilters } from "@/lib/delhi/types";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const filters = parseDelhiFilters(await searchParams);
  const data = await getDelhiHomeData(filters);

  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex flex-wrap items-center gap-2" action="/">
            <input type="hidden" name="view" value={filters.view} />
            <FilterSelect name="severity" label="Severity" value={filters.severity}>
              <option value="all">All Severity</option>
              {delhiSeverities.map((severity) => (
                <option key={severity} value={severity}>
                  {severityLabels[severity]}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="status" label="Status" value={filters.status}>
              <option value="all">All Status</option>
              {delhiStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </FilterSelect>
            <button
              type="submit"
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Apply
            </button>
          </form>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div className="hidden items-center gap-1 text-[11px] font-bold text-slate-400 sm:flex">
              <Activity className="h-3.5 w-3.5" />
              v0.2.1
            </div>
            <ViewToggle filters={filters} />
          </div>
        </div>
      </div>

      <section className="relative min-h-[calc(100svh-150px)] overflow-hidden bg-slate-100">
        {filters.view === "map" ? (
          <>
            <LazyDelhiMap reports={data.reports} height="calc(100svh - 150px)" />
            <div className="pointer-events-none absolute left-3 top-3 z-[500] flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
              <StatPill value={data.stats.activeReports} label="Active" tone="red" />
              <StatPill value={data.stats.totalReports} label="Reports" tone="orange" />
            </div>
            {data.warnings.length ? (
              <div className="absolute left-3 right-3 top-20 z-[500] rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900 shadow-sm sm:left-auto sm:w-[360px]">
                {data.warnings[0]}
              </div>
            ) : null}
          </>
        ) : (
          <div className="mx-auto max-w-4xl px-3 py-4">
            <ReportList reports={data.reports} />
          </div>
        )}

        <div className="fixed bottom-4 left-3 right-3 z-40 grid gap-2 sm:grid-cols-[1fr_320px]">
          <Link
            href="/report/new"
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#e60023] px-5 text-sm font-black text-white shadow-[0_10px_30px_rgba(230,0,35,0.25)] transition hover:bg-[#c9001f]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Report Garbage
          </Link>
          <Link
            href={buildDelhiQueryString(filters, {
              view: filters.view === "map" ? "list" : "map",
            })}
            className="hidden h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
          >
            {filters.view === "map" ? <List className="mr-2 h-4 w-4" /> : <MapIcon className="mr-2 h-4 w-4" />}
            {filters.view === "map" ? "Open List" : "Open Map"}
          </Link>
        </div>
      </section>
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="h-9 rounded-md border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-slate-700 shadow-sm outline-none transition focus:border-[#e60023] focus:ring-2 focus:ring-red-100"
      >
        {children}
      </select>
    </label>
  );
}

function ViewToggle({ filters }: { filters: DelhiFilters }) {
  return (
    <div className="inline-flex rounded-md bg-slate-100 p-1">
      <Link
        href={buildDelhiQueryString(filters, { view: "map" })}
        className={cn(
          "inline-flex h-8 items-center rounded-md px-3 text-xs font-bold transition",
          filters.view === "map" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-800",
        )}
      >
        <MapIcon className="mr-1.5 h-3.5 w-3.5" />
        Map
      </Link>
      <Link
        href={buildDelhiQueryString(filters, { view: "list" })}
        className={cn(
          "inline-flex h-8 items-center rounded-md px-3 text-xs font-bold transition",
          filters.view === "list" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-800",
        )}
      >
        <List className="mr-1.5 h-3.5 w-3.5" />
        List
      </Link>
    </div>
  );
}

function StatPill({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "red" | "orange";
}) {
  return (
    <div className="min-w-20 px-4 py-3">
      <div className={cn("text-lg font-black leading-none", tone === "red" ? "text-[#e60023]" : "text-[#f97316]")}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-slate-500">{label}</div>
    </div>
  );
}

function ReportList({ reports }: { reports: Awaited<ReturnType<typeof getDelhiHomeData>>["reports"] }) {
  if (!reports.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-600">
        No reports match this view yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 pb-20">
      {reports.map((report) => (
        <DelhiReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
