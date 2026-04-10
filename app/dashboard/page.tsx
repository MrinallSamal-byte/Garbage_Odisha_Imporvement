import Link from "next/link";
import { Suspense } from "react";
import { List, Map as MapIcon } from "lucide-react";

import { LazyReportsMap } from "@/components/maps/lazy-reports-map";
import { ReportCard } from "@/components/report/report-card";
import { ModerationBadge, StatusBadge } from "@/components/report/status-badge";
import { TrustScoreBadge } from "@/components/report/trust-score-badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { reportFiltersSchema } from "@/lib/validation/schemas";
import { getDashboardData } from "@/server/services/report-query-service";
import { emptyDashboardStats } from "@/server/services/report-query-service";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const rawSearchParams = await searchParams;
  const view = typeof rawSearchParams.view === "string" && rawSearchParams.view === "list" ? "list" : "map";
  const filters = reportFiltersSchema.parse({
    district: typeof rawSearchParams.district === "string" ? rawSearchParams.district : undefined,
    constituency: typeof rawSearchParams.constituency === "string" ? rawSearchParams.constituency : undefined,
    category: typeof rawSearchParams.category === "string" ? rawSearchParams.category : undefined,
    status: typeof rawSearchParams.status === "string" ? rawSearchParams.status : undefined,
    severity: typeof rawSearchParams.severity === "string" ? rawSearchParams.severity : undefined,
    sourceType: typeof rawSearchParams.sourceType === "string" ? rawSearchParams.sourceType : undefined,
    page: typeof rawSearchParams.page === "string" ? rawSearchParams.page : "1",
    pageSize: "20",
  });

  let stats = emptyDashboardStats;
  let items: ReturnType<typeof serializeReportListItem>[] = [];
  let feedWarning: string | null = null;
  let totalPages = 1;
  let allDistricts: string[] = [];

  try {
    const data = await getDashboardData(filters);
    stats = data.stats;
    items = data.reports.map(serializeReportListItem);
    allDistricts = data.allDistricts;
    totalPages = Math.ceil(data.total / 20);
  } catch (error) {
    console.error("Dashboard feed unavailable", error);
    feedWarning =
      "The dashboard is live, but the database-backed report feed could not be loaded right now.";
  }

  // allDistricts is computed from ALL matching reports before pagination,
  // so the dropdown stays consistent regardless of which page the user is on.
  const districts = allDistricts;
  const nextSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (typeof value === "string" && value.length > 0 && key !== "view") {
      nextSearchParams.set(key, value);
    }
  }

  const mapViewHref = (() => {
    const params = new URLSearchParams(nextSearchParams);
    params.set("view", "map");
    return `/dashboard?${params.toString()}`;
  })();

  const listViewHref = (() => {
    const params = new URLSearchParams(nextSearchParams);
    params.set("view", "list");
    return `/dashboard?${params.toString()}`;
  })();

  return (
    <main className="container py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="section-label">Public dashboard</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">See Odisha cleanliness reports on the map and timeline.</h1>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slateblue-100 bg-white p-1 shadow-card">
          <Link
            href={mapViewHref}
            className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
              view === "map" ? "bg-ink text-white" : "text-slateblue-700 hover:bg-slateblue-50"
            }`}
          >
            <MapIcon className="mr-2 h-4 w-4" />
            Map
          </Link>
          <Link
            href={listViewHref}
            className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
              view === "list" ? "bg-ink text-white" : "text-slateblue-700 hover:bg-slateblue-50"
            }`}
          >
            <List className="mr-2 h-4 w-4" />
            List
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Total reports" value={String(stats.totalReports)} />
        <StatCard label="Unresolved" value={String(stats.unresolvedReports)} />
        <StatCard label="Resolved" value={String(stats.resolvedReports)} />
        <StatCard label="High severity" value={String(stats.highSeverityReports)} />
      </div>
      {feedWarning ? (
        <Card className="mt-6 border border-amber-200 bg-amber-50/90 p-4 text-sm leading-6 text-amber-900">
          {feedWarning}
        </Card>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Filters</h2>
            <p className="mt-1 text-sm text-slateblue-600">Refine the public complaint feed.</p>
          </div>
          <form className="space-y-3">
            <input type="hidden" name="view" value={view} />
            <Select name="district" defaultValue={filters.district ?? ""}>
              <option value="">All districts</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </Select>
            <Input name="constituency" defaultValue={filters.constituency ?? ""} placeholder="Constituency name" />
            <Select name="status" defaultValue={filters.status ?? ""}>
              <option value="">All statuses</option>
              <option value="REPORTED">Reported</option>
              <option value="VERIFIED">Verified</option>
              <option value="FORWARDED">Forwarded</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
            </Select>
            <Select name="severity" defaultValue={filters.severity ?? ""}>
              <option value="">All severities</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">🟢 Low</option>
            </Select>
            <Select name="category" defaultValue={filters.category ?? ""}>
              <option value="">All categories</option>
              <option value="garbage">Garbage</option>
              <option value="overflow">Overflow</option>
              <option value="drain">Drain</option>
              <option value="roadside_dump">Roadside dump</option>
              <option value="mixed_waste">Mixed waste</option>
              <option value="litter">Litter</option>
            </Select>
            <Select name="sourceType" defaultValue={filters.sourceType ?? ""}>
              <option value="">All sources</option>
              <option value="LIVE_CAPTURE">📷 Live capture</option>
              <option value="GALLERY_UPLOAD">🖼 Gallery upload</option>
              <option value="MANUAL_PIN_ONLY">📍 Manual pin</option>
            </Select>
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white"
            >
              Apply filters
            </button>
          </form>
        </Card>

        <div className="space-y-6">
          {view === "map" ? (
            <>
              <Suspense fallback={<div className="surface-card h-[360px] p-6">Loading map...</div>}>
                <Card className="overflow-hidden p-3">
                  <LazyReportsMap
                    height={360}
                    markers={items.map((item) => ({
                      id: item.report.id,
                      latitude: item.report.latitude,
                      longitude: item.report.longitude,
                      title: item.report.reportCode,
                      subtitle: item.report.addressLine,
                    }))}
                  />
                </Card>
              </Suspense>
              <div className="grid gap-5">
                {items.length > 0 ? (
                  items.map((item) => <ReportCard key={item.report.id} item={item} />)
                ) : (
                  <EmptyDashboardState />
                )}
              </div>
            </>
          ) : items.length > 0 ? (
            <div className="grid gap-3">
              {items.map((item, index) => (
                <ListReportRow key={item.report.id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <EmptyDashboardState />
          )}

          {totalPages > 1 && (
            <PaginationControls
              currentPage={filters.page}
              totalPages={totalPages}
              searchParams={rawSearchParams}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-white/70 bg-white/85 p-5">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slateblue-500">{label}</div>
      <div className="mt-3 text-3xl font-black text-ink">{value}</div>
    </Card>
  );
}

function EmptyDashboardState() {
  return (
    <Card className="border-dashed">
      <p className="text-sm leading-6 text-slateblue-700">
        No public reports are available yet. Seed the database or submit the first report to populate
        this dashboard.
      </p>
    </Card>
  );
}

function ListReportRow({
  item,
  index,
}: {
  item: ReturnType<typeof serializeReportListItem>;
  index: number;
}) {
  return (
    <Link href={`/reports/${item.report.id}`}>
      <Card className="grid gap-4 rounded-[1.75rem] border border-slateblue-100 bg-white/90 p-4 transition hover:-translate-y-0.5 hover:shadow-card md:grid-cols-[72px_1.1fr_0.8fr]">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-rose-100 bg-rose-50 text-lg font-black text-rose-600">
          {index + 1}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={item.report.status} />
            <ModerationBadge status={item.report.moderationStatus} />
            <TrustScoreBadge score={item.report.trustScore} />
          </div>
          <div className="text-xl font-bold text-ink">{item.report.locality ?? item.assemblyConstituency?.name ?? item.report.reportCode}</div>
          <div className="text-sm leading-6 text-slateblue-700">{item.report.addressLine}</div>
          <div className="text-xs uppercase tracking-[0.16em] text-slateblue-500">
            {new Date(item.report.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        </div>
        <div className="space-y-2 text-left md:text-right">
          <div className="text-sm font-semibold text-ink">{item.mla?.name ?? item.mp?.name ?? "Representative pending"}</div>
          <div className="text-sm text-slateblue-600">
            {item.assemblyConstituency?.name ?? item.parliamentConstituency?.name ?? "Constituency unavailable"}
          </div>
          <div className="text-xs uppercase tracking-[0.16em] text-slateblue-500">
            {item.report.severity} severity
          </div>
        </div>
      </Card>
    </Link>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  function buildPageHref(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string" && value.length > 0 && key !== "page") {
        params.set(key, value);
      }
    }
    params.set("page", String(page));
    return `/dashboard?${params.toString()}`;
  }

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (currentPage <= 4) return i + 1;
    if (currentPage >= totalPages - 3) return totalPages - 6 + i;
    return currentPage - 3 + i;
  });

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      {currentPage > 1 && (
        <Link
          href={buildPageHref(currentPage - 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slateblue-100 bg-white text-sm font-semibold text-slateblue-700 transition hover:bg-slateblue-50"
        >
          ←
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page}
          href={buildPageHref(page)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
            page === currentPage
              ? "bg-ink text-white"
              : "border border-slateblue-100 bg-white text-slateblue-700 hover:bg-slateblue-50"
          }`}
        >
          {page}
        </Link>
      ))}
      {currentPage < totalPages && (
        <Link
          href={buildPageHref(currentPage + 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slateblue-100 bg-white text-sm font-semibold text-slateblue-700 transition hover:bg-slateblue-50"
        >
          →
        </Link>
      )}
    </div>
  );
}
