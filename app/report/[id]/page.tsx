/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPinned, UsersRound } from "lucide-react";

import { LazyBhubaneswarMap } from "@/components/civic/lazy-bhubaneswar-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { severityBadgeClasses, severityLabels, statusBadgeClasses, statusLabels } from "@/lib/civic/constants";
import { getCivicRepository } from "@/lib/civic/repository";
import { formatWardLabel, toMapReports, toMapWards } from "@/lib/civic/map-view";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const repository = getCivicRepository();
  const [report, wards] = await Promise.all([
    repository.getReportDetail(id),
    repository.listWards(),
  ]);

  if (!report) {
    notFound();
  }

  const mapReports = toMapReports([report], wards);

  return (
    <main className="container py-8 md:py-12">
      <div className="mb-5">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-slateblue-100 bg-white px-4 text-sm font-semibold text-slateblue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bhubaneswar map
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${severityBadgeClasses[report.report.severity]}`}>
              {severityLabels[report.report.severity]}
            </span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${statusBadgeClasses[report.report.status]}`}>
              {statusLabels[report.report.status]}
            </span>
          </div>

          <div>
            <div className="section-label">Bhubaneswar report</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-ink md:text-5xl">
              {report.report.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slateblue-700">
              {report.report.address}
            </p>
          </div>

          <Card className="overflow-hidden p-3">
            <img
              src={report.report.photoUrl}
              alt={report.report.title}
              className="h-[420px] w-full rounded-md object-cover"
            />
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="overflow-hidden p-0">
            <LazyBhubaneswarMap reports={mapReports} wards={toMapWards(wards)} height={320} />
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-xl font-bold text-ink">Location</h2>
            <div className="grid gap-3 text-sm text-slateblue-700">
              <div className="flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-civic-700" />
                {formatWardLabel(report.ward)}
              </div>
              <div className="font-mono text-xs text-slateblue-500">
                {report.report.lat.toFixed(5)}, {report.report.lng.toFixed(5)}
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-xl font-bold text-ink">Accountability</h2>
            <div className="grid gap-3 text-sm">
              <InfoRow label="MLA" value={`${report.mla.name} · ${report.mla.constituencyName}`} />
              <InfoRow label="MP" value={`${report.mp.name} · ${report.mp.constituencyName}`} />
              <InfoRow label="Waste" value={report.wasteType.label} />
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-xl font-bold text-ink">Public note</h2>
            <div className="grid gap-3 text-sm text-slateblue-700">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-civic-700" />
                {report.report.reporterCount} citizen report{report.report.reporterCount === 1 ? "" : "s"}
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-civic-700" />
                First reported {formatDate(report.report.createdAt)}
              </div>
            </div>
            <Link href="/report/new">
              <Button className="w-full rounded-md bg-[#e60023] hover:bg-[#c9001f]">
                Report another issue
              </Button>
            </Link>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slateblue-100 bg-slateblue-50/50 px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slateblue-400">{label}</div>
      <div className="mt-1 font-bold text-ink">{value}</div>
    </div>
  );
}
