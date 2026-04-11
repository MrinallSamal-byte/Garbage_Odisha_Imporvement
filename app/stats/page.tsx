import Link from "next/link";
import { BarChart3, CheckCircle2, Flame, MapPinned, Siren } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { reportSeverities, reportStatuses, severityLabels, statusLabels } from "@/lib/civic/constants";
import { getCivicRepository } from "@/lib/civic/repository";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const repository = getCivicRepository();
  const [reports, stats] = await Promise.all([
    repository.listReports(),
    repository.getStats(),
  ]);
  const activeReports = reports.filter((item) => item.report.status !== "resolved");
  const resolvedReports = reports.filter((item) => item.report.status === "resolved");
  const criticalActive = activeReports.filter((item) => item.report.severity === "critical");

  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">Stats</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          Bhubaneswar cleanup trends.
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          Ward rankings and report totals are built from Bhubaneswar civic data. Replace the BMC
          ward GeoJSON later and this page will follow the same boundaries automatically.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-4">
        <StatCard icon={BarChart3} title="Total reports" value={reports.length} href="/" />
        <StatCard icon={Siren} title="Active reports" value={activeReports.length} href="/?status=unresolved" />
        <StatCard icon={CheckCircle2} title="Resolved" value={resolvedReports.length} href="/?status=resolved" />
        <StatCard icon={Flame} title="Critical active" value={criticalActive.length} href="/?severity=critical" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h2 className="text-xl font-bold text-ink">Severity breakdown</h2>
          <div className="space-y-3">
            {reportSeverities.map((severity) => (
              <Link
                key={severity}
                href={`/?severity=${severity}`}
                className="flex items-center justify-between rounded-md border border-slateblue-100 bg-white px-4 py-3 text-sm transition hover:border-civic-200"
              >
                <span className="font-semibold text-slateblue-700">{severityLabels[severity]}</span>
                <span className="font-black text-ink">
                  {activeReports.filter((item) => item.report.severity === severity).length}
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-xl font-bold text-ink">Status breakdown</h2>
          <div className="space-y-3">
            {reportStatuses.map((status) => (
              <Link
                key={status}
                href={`/?status=${status}`}
                className="flex items-center justify-between rounded-md border border-slateblue-100 bg-white px-4 py-3 text-sm transition hover:border-civic-200"
              >
                <span className="font-semibold text-slateblue-700">{statusLabels[status]}</span>
                <span className="font-black text-ink">
                  {reports.filter((item) => item.report.status === status).length}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-8 space-y-4 p-5">
        <div className="flex items-center gap-3">
          <MapPinned className="h-5 w-5 text-civic-700" />
          <h2 className="text-xl font-bold text-ink">Top complaint-heavy wards</h2>
        </div>
        {stats.topWards.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {stats.topWards.map((ward) => (
              <Link
                key={ward.wardId}
                href={`/ward/${ward.wardId}`}
                className="flex items-center justify-between rounded-md border border-slateblue-100 bg-white px-4 py-3 text-sm transition hover:border-civic-200"
              >
                <span className="line-clamp-1 font-semibold text-slateblue-700">{ward.wardLabel}</span>
                <span className="font-black text-ink">{ward.count}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slateblue-600">
            Ward rankings will populate as Bhubaneswar residents submit reports.
          </p>
        )}
      </Card>

      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Back to map</Button>
        </Link>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  href,
}: {
  icon: typeof BarChart3;
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full p-5 transition hover:border-civic-200">
        <Icon className="h-5 w-5 text-civic-700" />
        <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
          {title}
        </div>
        <div className="mt-2 text-3xl font-black text-ink">{value}</div>
      </Card>
    </Link>
  );
}
