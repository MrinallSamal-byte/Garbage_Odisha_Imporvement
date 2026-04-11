import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, BarChart3, List, Map as MapIcon, Plus } from "lucide-react";

import { LazyBhubaneswarMap } from "@/components/civic/lazy-bhubaneswar-map";
import { reportSeverities, reportStatuses, severityLabels, statusLabels } from "@/lib/civic/constants";
import { getCivicRepository } from "@/lib/civic/repository";
import { buildHomeQuery, parseHomeFilters } from "@/lib/civic/search-params";
import type { HomeFilters, ReportListItem } from "@/lib/civic/types";
import { formatWardLabel, toMapReports, toMapWards } from "@/lib/civic/map-view";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type WorstWard = {
  wardId: string;
  wardLabel: string;
  count: number;
};

function buildHref(filters: HomeFilters, overrides: Partial<HomeFilters> = {}) {
  const query = buildHomeQuery({ ...filters, ...overrides });
  return query ? `/?${query}` : "/";
}

function buildWorstWards(reports: ReportListItem[]) {
  const byWard = new Map<string, WorstWard>();

  for (const item of reports.filter((entry) => entry.report.status !== "resolved")) {
    const current = byWard.get(item.ward.id);
    byWard.set(item.ward.id, {
      wardId: item.ward.id,
      wardLabel: formatWardLabel(item.ward),
      count: (current?.count ?? 0) + item.report.reporterCount,
    });
  }

  return Array.from(byWard.values())
    .sort((left, right) => right.count - left.count || left.wardLabel.localeCompare(right.wardLabel))
    .slice(0, 10);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const filters = parseHomeFilters(await searchParams);
  const repository = getCivicRepository();
  const [allReports, filteredReports, wards] = await Promise.all([
    repository.listReports(),
    repository.listReports({ severity: filters.severity, status: filters.status }),
    repository.listWards(),
  ]);

  const mapWards = toMapWards(wards);
  const mapReports = toMapReports(filteredReports, wards);
  const activeReports = allReports.filter((item) => item.report.status !== "resolved");
  const worstWards = buildWorstWards(allReports);

  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex flex-wrap items-center gap-2" action="/">
            <input type="hidden" name="view" value={filters.view} />
            <FilterSelect name="severity" label="Severity" value={filters.severity}>
              <option value="all">All Severity</option>
              {reportSeverities.map((severity) => (
                <option key={severity} value={severity}>
                  {severityLabels[severity]}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="status" label="Status" value={filters.status}>
              <option value="all">All Status</option>
              {reportStatuses.map((status) => (
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
              Bhubaneswar
            </div>
            <ViewToggle filters={filters} />
          </div>
        </div>
      </div>

      <section className="relative min-h-[calc(100svh-150px)] overflow-hidden bg-slate-100">
        {filters.view === "map" ? (
          <>
            <LazyBhubaneswarMap reports={mapReports} wards={mapWards} height="calc(100svh - 150px)" />
            <div className="pointer-events-none absolute left-3 top-3 z-[500] flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
              <StatPill value={activeReports.length} label="Active" tone="red" />
              <StatPill value={allReports.length} label="Reports" tone="orange" />
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-5xl px-3 py-4">
            <ReportList reports={filteredReports} />
          </div>
        )}

        <WorstWardsPanel wards={worstWards} />

        <div className="fixed bottom-4 left-3 right-3 z-40 grid gap-2 sm:grid-cols-[1fr_320px]">
          <Link
            href="/report/new"
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#e60023] px-5 text-sm font-black text-white shadow-[0_10px_30px_rgba(230,0,35,0.25)] transition hover:bg-[#c9001f]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Report Garbage
          </Link>
          <Link
            href="/stats"
            className="hidden h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Bhubaneswar Stats
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

function ViewToggle({ filters }: { filters: HomeFilters }) {
  return (
    <div className="inline-flex rounded-md bg-slate-100 p-1">
      <Link
        href={buildHref(filters, { view: "map" })}
        className={cn(
          "inline-flex h-8 items-center rounded-md px-3 text-xs font-bold transition",
          filters.view === "map" ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-slate-800",
        )}
      >
        <MapIcon className="mr-1.5 h-3.5 w-3.5" />
        Map
      </Link>
      <Link
        href={buildHref(filters, { view: "list" })}
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

function WorstWardsPanel({ wards }: { wards: WorstWard[] }) {
  if (!wards.length) return null;

  const max = Math.max(...wards.map((ward) => ward.count));

  return (
    <div className="absolute inset-x-0 bottom-[5.25rem] z-[450] rounded-t-md bg-white px-4 pb-5 pt-4 shadow-[0_-10px_24px_rgba(15,23,42,0.08)]">
      <div className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
        Worst wards by reports
      </div>
      <div className="grid gap-2">
        {wards.map((ward, index) => (
          <Link
            key={ward.wardId}
            href={`/ward/${ward.wardId}`}
            className="grid grid-cols-[28px_1fr_34px] items-center gap-2 rounded-md px-1 py-1.5 text-sm transition hover:bg-slate-50"
          >
            <span className={cn("font-black", index < 3 ? "text-[#e60023]" : "text-slate-300")}>{index + 1}</span>
            <span>
              <span className="block font-black text-slate-900">{ward.wardLabel.replace("Ward ", "")}</span>
              <span className="mt-1 block h-1 rounded-full bg-slate-100">
                <span
                  className="block h-1 rounded-full bg-gradient-to-r from-[#e60023] to-[#f97316]"
                  style={{ width: `${Math.max(10, Math.round((ward.count / max) * 100))}%` }}
                />
              </span>
            </span>
            <span className="text-right text-xs font-black text-slate-500">{ward.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ReportList({ reports }: { reports: ReportListItem[] }) {
  if (!reports.length) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white p-5 text-sm font-semibold text-slate-600">
        No Bhubaneswar reports match this view yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 pb-36">
      {reports.map((item) => (
        <Link
          key={item.report.id}
          href={`/report/${item.report.id}`}
          className="grid gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[#e60023]/30 sm:grid-cols-[110px_1fr_auto]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.report.photoUrl}
            alt={item.report.title}
            className="h-28 w-full rounded-md object-cover sm:h-full"
          />
          <div>
            <div className="text-sm font-black text-slate-900">{item.report.title}</div>
            <div className="mt-1 text-xs leading-5 text-slate-500">{item.report.address}</div>
            <div className="mt-2 text-xs font-bold text-slate-500">{formatWardLabel(item.ward)}</div>
          </div>
          <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
            <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black capitalize text-[#e60023]">
              {item.report.severity}
            </div>
            <div className="mt-0 text-xs font-bold text-slate-500 sm:mt-3">
              {item.report.reporterCount} report{item.report.reporterCount === 1 ? "" : "s"}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
