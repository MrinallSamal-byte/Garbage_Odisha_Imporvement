import Link from "next/link";
import { ArrowRight, BarChart3, Camera, MapPinned, MessageCircle, UsersRound } from "lucide-react";

import { DelhiFilterBar } from "@/components/delhi/delhi-filter-bar";
import { LazyDelhiMap } from "@/components/delhi/lazy-delhi-map";
import { DelhiReportCard } from "@/components/delhi/delhi-report-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { parseDelhiFilters } from "@/lib/delhi/search-params";
import { getDelhiHomeData } from "@/lib/delhi/repository";
import { statusLabels } from "@/lib/delhi/constants";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const filters = parseDelhiFilters(await searchParams);
  const data = await getDelhiHomeData(filters);

  return (
    <main className="pb-16">
      <section className="relative overflow-hidden border-b border-white/60 bg-hero-wash">
        <div className="container grid gap-8 py-10 lg:grid-cols-[0.88fr_1.12fr] lg:py-14">
          <div className="space-y-6">
            <div className="section-label">Delhi Garbage Watch</div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-ink md:text-6xl">
                Crowdsource Delhi garbage reports with location-based accountability.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slateblue-700 md:text-lg">
                Photograph roadside dumps, map them to the right civic authority, ward or
                equivalent, MLA, and MP, then let the community confirm and verify cleanup.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/report/new">
                <Button size="lg">
                  <Camera className="mr-2 h-4 w-4" />
                  Report Garbage
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="secondary" size="lg">
                  How it works
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Active complaints" value={String(data.stats.activeReports)} href="/?status=unresolved" />
              <StatCard label="Total reports" value={String(data.stats.totalReports)} />
              <StatCard label="Resolved" value={String(data.stats.resolvedReports)} href="/?status=resolved" />
              <StatCard label="Critical active" value={String(data.stats.criticalReports)} href="/?severity=critical" />
            </div>
          </div>

          <Card className="relative overflow-hidden p-4">
            <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-civic-200/40 blur-3xl" />
            <div className="absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-saffron-200/40 blur-3xl" />
            <div className="relative space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniMetric icon={MapPinned} label="Coverage" value="Whole Delhi" />
                <MiniMetric icon={UsersRound} label="Anonymous" value="Default" />
                <MiniMetric icon={MessageCircle} label="Complaint assist" value="WhatsApp ready" />
              </div>
              {data.warnings.length ? (
                <SetupWarning warnings={data.warnings} />
              ) : (
                <p className="rounded-2xl border border-civic-100 bg-civic-50 px-4 py-3 text-sm leading-6 text-civic-900">
                  Live Delhi data is loaded from the DigitalOcean PostgreSQL reporting schema.
                </p>
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="container -mt-5 space-y-6 pb-16">
        <DelhiFilterBar filters={filters} authorities={data.authorities} />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {filters.view === "map" ? (
              <Card className="overflow-hidden p-3">
                <LazyDelhiMap reports={data.reports} height={560} />
              </Card>
            ) : (
              <ReportList reports={data.reports} />
            )}
          </div>

          <aside className="space-y-5">
            <Card className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-civic-700" />
                <h2 className="text-lg font-bold text-ink">Status breakdown</h2>
              </div>
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

            <Card className="space-y-4 p-5">
              <h2 className="text-lg font-bold text-ink">Top active wards</h2>
              {data.stats.topWards.length ? (
                <div className="space-y-3">
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
                  Ward rankings will appear after the Delhi GIS schema is live and reports are submitted.
                </p>
              )}
            </Card>

            <Card className="space-y-4 border-civic-100 bg-civic-50/80 p-5">
              <h2 className="text-lg font-bold text-ink">Join the community</h2>
              <p className="text-sm leading-6 text-civic-900">
                Get updates, flag bad mappings, and help test the Delhi-wide workflow.
              </p>
              <a
                href={env.NEXT_PUBLIC_COMMUNITY_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-white"
              >
                Open community group
              </a>
            </Card>
          </aside>
        </div>

        {filters.view === "map" ? <ReportList reports={data.reports.slice(0, 8)} compact /> : null}
      </section>
    </main>
  );
}

function ReportList({ reports, compact = false }: { reports: Awaited<ReturnType<typeof getDelhiHomeData>>["reports"]; compact?: boolean }) {
  if (!reports.length) {
    return (
      <Card className="border-dashed p-6">
        <h2 className="text-lg font-bold text-ink">No reports match this view yet.</h2>
        <p className="mt-2 text-sm leading-6 text-slateblue-700">
          Once the Delhi schema is applied and public reports are submitted, matching complaints
          will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className={compact ? "grid gap-4 md:grid-cols-2" : "grid gap-4"}>
      {reports.map((report) => (
        <DelhiReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const card = (
    <Card className="border border-white/60 bg-white/85 p-5 transition hover:border-civic-200">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-ink">{value}</div>
    </Card>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPinned;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slateblue-100 bg-white/80 p-4">
      <Icon className="h-5 w-5 text-civic-700" />
      <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
        {label}
      </div>
      <div className="mt-1 font-black text-ink">{value}</div>
    </div>
  );
}

function SetupWarning({ warnings }: { warnings: string[] }) {
  return (
    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950">
      <div className="font-bold">Database setup is not complete yet.</div>
      <div className="mt-2 space-y-1">
        {warnings.map((warning) => (
          <p key={warning}>{warning}</p>
        ))}
      </div>
    </div>
  );
}
