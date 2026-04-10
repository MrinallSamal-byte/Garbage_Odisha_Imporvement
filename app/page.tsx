import Link from "next/link";
import { ArrowRight, Camera, MapPinned, ShieldCheck, Sparkles, Trophy, Rss } from "lucide-react";

import { LazyReportsMap } from "@/components/maps/lazy-reports-map";
import { ReportCard } from "@/components/report/report-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboardData } from "@/server/services/report-query-service";
import { emptyDashboardStats } from "@/server/services/report-query-service";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

// ISR: serve cached HTML instantly; regenerate in the background every 60 s.
// The try/catch in the component already handles a missing DB gracefully.
export const revalidate = 60;

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

const reportFlowChecklist = [
  {
    eyebrow: "Capture",
    title: "Take a live photo first",
    description: "Live camera capture is the default, trust-first source path for public complaints.",
  },
  {
    eyebrow: "Locate",
    title: "Use device GPS for exact routing",
    description: "Latitude, longitude, timestamp, and GPS accuracy are captured from the device, not inferred from the image.",
  },
  {
    eyebrow: "Review",
    title: "See the mapped MLA and MP",
    description: "The preview screen shows reverse-geocoded location, constituencies, representative cards, and AI consistency notes.",
  },
  {
    eyebrow: "Submit",
    title: "Publish to the public dashboard",
    description: "Once confirmed, the report appears in the live dashboard and can move through moderation and status updates.",
  },
];

export default async function HomePage() {
  let stats = emptyDashboardStats;
  let reports: Awaited<ReturnType<typeof getDashboardData>>["reports"] = [];
  let feedWarning: string | null = null;

  try {
    const data = await getDashboardData();
    stats = data.stats;
    reports = data.reports;
  } catch (error) {
    console.error("Homepage dashboard feed unavailable", error);
    feedWarning =
      "The public report feed is temporarily unavailable. The app shell is still live, but the database-backed dashboard data could not be loaded.";
  }

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
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard label="Reports logged" value={String(stats.totalReports)} />
              <StatCard label="Unresolved" value={String(stats.unresolvedReports)} />
              <StatCard label="Resolved" value={String(stats.resolvedReports)} />
              <StatCard label="Avg trust score" value={stats.averageTrustScore > 0 ? `${stats.averageTrustScore}/100` : "—"} />
            </div>
            {feedWarning ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-6 text-amber-900">
                {feedWarning}
              </div>
            ) : null}
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
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-5">
            <div className="section-label">Report from your phone</div>
            <h2 className="text-3xl font-black tracking-tight text-ink md:text-4xl">
              Capture, review, and submit with GPS-backed area verification.
            </h2>
            <p className="max-w-xl text-base leading-8 text-slateblue-700">
              The report flow is built for a real field submission: live camera, exact device GPS,
              constituency mapping, representative preview, and final confirmation before publishing.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/report">
                <Button size="lg">
                  Start live report
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" size="lg">
                  See current reports
                </Button>
              </Link>
            </div>
          </div>

          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            {reportFlowChecklist.map((item, index) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-slateblue-100 bg-white/70 p-4"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-civic-700">
                  {item.eyebrow} {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-3 text-lg font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slateblue-700">{item.description}</p>
              </div>
            ))}
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

      {/* Leaderboard + digest teaser */}
      <section className="border-y border-white/60 bg-white/60 backdrop-blur">
        <div className="container grid gap-5 py-12 md:grid-cols-2">
          <Link href="/leaderboard" className="group flex items-start gap-4 rounded-[1.75rem] border border-amber-100 bg-amber-50/80 p-6 transition hover:bg-amber-50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-ink">District accountability leaderboard</div>
              <p className="mt-1 text-sm leading-6 text-slateblue-700">
                See which Odisha districts are resolving complaints fastest — and which have the most
                unresolved HIGH and CRITICAL reports.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                View leaderboard <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
          <a
            href="/api/digest"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-[1.75rem] border border-civic-100 bg-civic-50/80 p-6 transition hover:bg-civic-50"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-civic-100 text-civic-600">
              <Rss className="h-6 w-6" />
            </div>
            <div>
              <div className="font-bold text-ink">RSS digest — top unresolved reports</div>
              <p className="mt-1 text-sm leading-6 text-slateblue-700">
                Subscribe via any RSS reader to receive the top HIGH and CRITICAL unresolved complaints
                across Odisha. Useful for journalists, RTI activists, and local monitoring groups.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-civic-700">
                Open RSS feed <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </a>
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
          {featuredReports.length > 0 ? (
            featuredReports.map((report) => <ReportCard key={report.report.id} item={report} />)
          ) : (
            <Card className="border-dashed">
              <p className="text-sm leading-6 text-slateblue-700">
                No public reports are visible yet. Once the database is seeded and reports are submitted,
                the live dashboard feed will appear here.
              </p>
            </Card>
          )}
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
