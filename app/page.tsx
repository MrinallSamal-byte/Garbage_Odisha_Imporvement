import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";

import { HomeFilterControls } from "@/components/civic/home-filter-controls";
import { LazyBhubaneswarMap } from "@/components/civic/lazy-bhubaneswar-map";
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
    <div className="flex h-[calc(100svh-57px)] flex-col overflow-hidden bg-white text-gray-900">
      <div className="shrink-0 border-b border-gray-50 bg-white px-4 py-1.5">
        <HomeFilterControls filters={filters} />
      </div>

      <section className="relative flex-1 overflow-hidden bg-gray-100">
        {filters.view === "map" ? (
          <>
            <LazyBhubaneswarMap reports={mapReports} wards={mapWards} height="100%" />
            <div className="pointer-events-none absolute left-3 top-3 z-[500] flex overflow-hidden rounded-xl border border-gray-100 bg-white/95 shadow-sm">
              <StatPill value={activeReports.length} label="Active" tone="red" />
              <StatPill value={allReports.length} label="Reports" tone="orange" />
            </div>
          </>
        ) : (
          <div className="mx-auto max-w-5xl px-3 py-4">
            <ReportList reports={filteredReports} />
          </div>
        )}

        {filters.statsOpen ? <WorstWardsPanel wards={worstWards} /> : null}

        <div className="bottom-bar fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white px-4 pt-2.5">
          <div className="flex gap-2.5">
          <Link
            href="/report/new"
            className="inline-flex h-12 flex-[3] items-center justify-center rounded-xl bg-red-600 px-5 text-[15px] font-bold text-white shadow-[0_4px_16px_rgba(220,38,38,0.3)] transition-transform active:scale-[0.98]"
          >
            <Plus className="mr-2 h-[18px] w-[18px]" />
            Report Garbage
          </Link>
          <Link
            href={buildHref(filters, { statsOpen: !filters.statsOpen })}
            className="inline-flex h-12 flex-[1] flex-col items-center justify-center gap-0.5 rounded-xl border px-5 text-sm font-bold transition-transform active:scale-[0.98]"
            style={{
              background: filters.statsOpen ? "#fef2f2" : "#f9fafb",
              borderColor: filters.statsOpen ? "#fecaca" : "#e5e7eb",
            }}
            aria-label={filters.statsOpen ? "Hide ward leaderboard" : "Show ward leaderboard"}
          >
            <BarChart3 className={cn("h-[18px] w-[18px]", filters.statsOpen ? "text-red-500" : "text-gray-400")} />
            {activeReports.length > 0 ? (
              <span className={cn("text-[9px] font-bold", filters.statsOpen ? "text-red-600" : "text-gray-400")}>
                {activeReports.length}
              </span>
            ) : null}
          </Link>
          </div>
        </div>
      </section>
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
      <div className={cn("font-mono text-lg font-extrabold leading-none", tone === "red" ? "text-red-600" : "text-orange-500")}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-gray-500">{label}</div>
    </div>
  );
}

function WorstWardsPanel({ wards }: { wards: WorstWard[] }) {
  if (!wards.length) return null;

  const max = Math.max(...wards.map((ward) => ward.count));

  return (
    <div className="absolute inset-x-0 bottom-[4.9rem] z-[450] rounded-t-2xl bg-white px-4 pb-5 pt-4 shadow-[0_-4px_24px_rgba(0,0,0,0.1)]">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
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
