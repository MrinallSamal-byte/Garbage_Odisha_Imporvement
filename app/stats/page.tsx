import Link from "next/link";
import { BarChart3, CheckCircle2, Flame, MapPinned, Siren } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDelhiHomeData } from "@/lib/delhi/repository";
import { severityLabels, statusLabels } from "@/lib/delhi/constants";
import type { DelhiFilters } from "@/lib/delhi/types";

export const dynamic = "force-dynamic";

const allFilters: DelhiFilters = {
  view: "map",
  severity: "all",
  status: "all",
  wasteType: "all",
  authority: "",
  ward: "",
  mla: "",
  mp: "",
  q: "",
};

export default async function StatsPage() {
  const data = await getDelhiHomeData(allFilters);

  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">Stats</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          Delhi analytics and accountability trends.
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          Aggregates are read from the DigitalOcean PostgreSQL reporting schema. Until PostGIS is
          available and the Delhi migration is applied, this page shows the live setup warning and
          empty counters.
        </p>
      </div>

      {data.warnings.length ? (
        <Card className="mt-8 border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          <div className="font-bold">Database setup is not complete yet.</div>
          {data.warnings.map((warning) => (
            <p key={warning} className="mt-2">
              {warning}
            </p>
          ))}
        </Card>
      ) : null}

      <div className="mt-10 grid gap-5 md:grid-cols-4">
        <StatCard
          icon={BarChart3}
          title="Total reports"
          value={data.stats.totalReports}
          href="/"
        />
        <StatCard
          icon={Siren}
          title="Active reports"
          value={data.stats.activeReports}
          href="/?status=unresolved"
        />
        <StatCard
          icon={CheckCircle2}
          title="Resolved"
          value={data.stats.resolvedReports}
          href="/?status=resolved"
        />
        <StatCard
          icon={Flame}
          title="Critical active"
          value={data.stats.criticalReports}
          href="/?severity=critical"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h2 className="text-xl font-bold text-ink">Severity breakdown</h2>
          <div className="space-y-3">
            {data.stats.severityDistribution.map((item) => (
              <Link
                key={item.severity}
                href={`/?severity=${item.severity}`}
                className="flex items-center justify-between rounded-2xl border border-slateblue-100 bg-white px-4 py-3 text-sm transition hover:border-civic-200"
              >
                <span className="font-semibold text-slateblue-700">{severityLabels[item.severity]}</span>
                <span className="font-black text-ink">{item.count}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-xl font-bold text-ink">Status breakdown</h2>
          <div className="space-y-3">
            {data.stats.statusDistribution.map((item) => (
              <Link
                key={item.status}
                href={`/?status=${item.status}`}
                className="flex items-center justify-between rounded-2xl border border-slateblue-100 bg-white px-4 py-3 text-sm transition hover:border-civic-200"
              >
                <span className="font-semibold text-slateblue-700">{statusLabels[item.status]}</span>
                <span className="font-black text-ink">{item.count}</span>
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
        {data.stats.topWards.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.stats.topWards.map((ward) => (
              <Link
                key={ward.wardId}
                href={`/ward/${ward.wardId}`}
                className="flex items-center justify-between rounded-2xl border border-slateblue-100 bg-white px-4 py-3 text-sm transition hover:border-civic-200"
              >
                <span className="line-clamp-1 font-semibold text-slateblue-700">{ward.wardLabel}</span>
                <span className="font-black text-ink">{ward.count}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slateblue-600">
            Ward rankings will populate after Delhi reports are stored in the PostGIS-backed schema.
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
