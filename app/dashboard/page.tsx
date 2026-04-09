import { Suspense } from "react";

import { LazyReportsMap } from "@/components/maps/lazy-reports-map";
import { ReportCard } from "@/components/report/report-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { reportFiltersSchema } from "@/lib/validation/schemas";
import { getDashboardData } from "@/server/services/report-query-service";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const rawSearchParams = await searchParams;
  const filters = reportFiltersSchema.parse({
    district: typeof rawSearchParams.district === "string" ? rawSearchParams.district : undefined,
    constituency: typeof rawSearchParams.constituency === "string" ? rawSearchParams.constituency : undefined,
    category: typeof rawSearchParams.category === "string" ? rawSearchParams.category : undefined,
    status: typeof rawSearchParams.status === "string" ? rawSearchParams.status : undefined,
    severity: typeof rawSearchParams.severity === "string" ? rawSearchParams.severity : undefined,
    sourceType: typeof rawSearchParams.sourceType === "string" ? rawSearchParams.sourceType : undefined,
  });

  const { reports, stats } = await getDashboardData(filters);
  const items = reports.map(serializeReportListItem);
  const districts = Array.from(new Set(items.map((item) => item.district?.name).filter(Boolean))) as string[];

  return (
    <main className="container py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="section-label">Public dashboard</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">See Odisha cleanliness reports on the map and timeline.</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="Total reports" value={String(stats.totalReports)} />
        <StatCard label="Unresolved" value={String(stats.unresolvedReports)} />
        <StatCard label="Resolved" value={String(stats.resolvedReports)} />
        <StatCard label="High severity" value={String(stats.highSeverityReports)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink">Filters</h2>
            <p className="mt-1 text-sm text-slateblue-600">Refine the public complaint feed.</p>
          </div>
          <form className="space-y-3">
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
            <Select name="category" defaultValue={filters.category ?? ""}>
              <option value="">All categories</option>
              <option value="garbage">Garbage</option>
              <option value="overflow">Overflow</option>
              <option value="drain">Drain</option>
              <option value="roadside_dump">Roadside dump</option>
              <option value="mixed_waste">Mixed waste</option>
              <option value="litter">Litter</option>
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
            {items.map((item) => (
              <ReportCard key={item.report.id} item={item} />
            ))}
          </div>
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
