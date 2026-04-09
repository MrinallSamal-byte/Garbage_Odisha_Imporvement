import Link from "next/link";
import { ArrowRight, Camera, MapPinned, ShieldCheck, Sparkles } from "lucide-react";

import { LazyReportsMap } from "@/components/maps/lazy-reports-map";
import { ReportCard } from "@/components/report/report-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/server/services/report-query-service";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Capture live evidence",
    description: "Open the phone camera, take a live photo, and keep the report tied to an actual moment in time.",
    icon: Camera,
  },
  {
    title: "Resolve exact Odisha location",
    description: "Use browser GPS, reverse geocoding, and Odisha constituency mapping to identify the correct area.",
    icon: MapPinned,
  },
  {
    title: "Route accountability",
    description: "Show the mapped MLA and MP, publish the complaint, and track moderation and status changes publicly.",
    icon: ShieldCheck,
  },
];

export default async function HomePage() {
  const { stats, reports } = await getDashboardData();
  const featuredReports = reports.slice(0, 2).map(serializeReportListItem);

  return (
    <main className="pb-16">
      <section className="relative overflow-hidden border-b border-white/50 bg-hero-wash">
        <div className="container grid gap-10 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
          <div className="space-y-7">
            <div className="section-label animate-fade-up">Civic cleanliness reporting for Odisha</div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black tracking-tight text-ink md:text-6xl">
                GPS-first garbage reporting with constituency-aware accountability.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slateblue-700">
                SafaOdisha helps citizens capture live evidence of public cleanliness issues, map
                them to the correct Odisha constituencies, and publish them with representative
                context and transparent moderation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/report">
                <Button size="lg">
                  Report now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">
                  Explore dashboard
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Reports logged" value={String(stats.totalReports)} />
              <StatCard label="Unresolved" value={String(stats.unresolvedReports)} />
              <StatCard label="Average trust" value={`${stats.averageTrustScore}`} />
            </div>
          </div>

          <Card className="relative overflow-hidden bg-white/88 p-4 sm:p-5">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-saffron-200/35 blur-3xl" />
            <div className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-civic-200/40 blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-civic-700">
                <Sparkles className="h-4 w-4" />
                Odisha public dashboard snapshot
              </div>
              <LazyReportsMap
                height={340}
                markers={reports.map((report) => ({
                  id: report.report.id,
                  latitude: report.report.latitude,
                  longitude: report.report.longitude,
                  title: report.report.reportCode,
                  subtitle: report.report.addressLine,
                }))}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="border border-civic-100 bg-civic-50/80 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-civic-700">
                    GIS routing
                  </div>
                  <p className="mt-2 text-sm leading-6 text-civic-800">
                    Reports are mapped to assembly and parliamentary constituencies using spatial lookup.
                  </p>
                </Card>
                <Card className="border border-saffron-100 bg-saffron-50/80 p-4">
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron-700">
                    AI assistance
                  </div>
                  <p className="mt-2 text-sm leading-6 text-saffron-900">
                    AI is used only for scene understanding, clue extraction, and moderation help.
                  </p>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="container py-16">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="section-label">How it works</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-ink">Built for real civic routing, not a fake demo flow.</h2>
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-civic-50 text-civic-700">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slateblue-500">
                Step {index + 1}
              </div>
              <h3 className="text-xl font-bold text-ink">{step.title}</h3>
              <p className="text-sm leading-6 text-slateblue-700">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pb-16">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="section-label">Recent reports</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-ink">Public issues already visible on the dashboard.</h2>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-civic-700 underline decoration-civic-300 underline-offset-4">
            Open full dashboard
          </Link>
        </div>
        <div className="mt-10 grid gap-5">
          {featuredReports.map((report) => (
            <ReportCard key={report.report.id} item={report} />
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border border-white/60 bg-white/85 p-5">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slateblue-500">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight text-ink">{value}</div>
    </Card>
  );
}
