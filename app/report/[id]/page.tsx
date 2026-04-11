/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, ExternalLink, MapPinned } from "lucide-react";

import { AccountabilityCard } from "@/components/delhi/accountability-card";
import { ConfirmReportButton } from "@/components/delhi/confirm-report-button";
import { DelhiSeverityBadge, DelhiStatusBadge } from "@/components/delhi/severity-status-badges";
import { ShareDelhiReportButton } from "@/components/delhi/share-report-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDelhiReportById } from "@/lib/delhi/repository";
import { wasteTypeLabels } from "@/lib/delhi/constants";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function daysSince(value: string) {
  const start = new Date(value).getTime();
  const diff = Date.now() - start;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildWhatsAppHref(reportUrl: string, report: NonNullable<Awaited<ReturnType<typeof getDelhiReportById>>>) {
  const message = [
    "Garbage complaint requiring civic action:",
    `Location: ${report.addressText}`,
    report.ward.number ? `Ward: ${report.ward.number} ${report.ward.name ?? ""}`.trim() : null,
    report.authority.name ? `Civic authority: ${report.authority.name}` : null,
    report.mla?.name ? `MLA: ${report.mla.name}` : null,
    report.mp?.name ? `MP: ${report.mp.name}` : null,
    `Report link: ${reportUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `${env.NEXT_PUBLIC_COMPLAINT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export default async function DelhiReportDetailPage({ params }: PageProps) {
  const { id } = await params;

  let report: Awaited<ReturnType<typeof getDelhiReportById>> = null;
  let setupError: string | null = null;

  try {
    report = await getDelhiReportById(id);
  } catch (error) {
    setupError = error instanceof Error ? error.message : "The Delhi report table is not readable yet.";
  }

  if (setupError) {
    return (
      <main className="container py-12">
        <Card className="max-w-3xl border-amber-200 bg-amber-50 p-6 text-amber-950">
          <div className="section-label">Report detail unavailable</div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">
            Delhi report details need the PostGIS-backed schema.
          </h1>
          <p className="mt-3 text-sm leading-6">
            {setupError} Apply the Delhi migration after PostGIS is available on the DigitalOcean
            PostgreSQL cluster, then this public detail route will read from `public.report_cards`.
          </p>
          <div className="mt-6">
            <Link href="/">
              <Button variant="secondary">Back to home</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (!report) {
    notFound();
  }

  const reportUrl = `${env.NEXT_PUBLIC_APP_URL}/report/${report.id}`;
  const openDays = daysSince(report.createdAt);
  const whatsappHref = buildWhatsAppHref(reportUrl, report);

  return (
    <main className="container py-8 md:py-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-slateblue-100 bg-white px-4 text-sm font-semibold text-slateblue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <ShareDelhiReportButton
          title={report.title}
          text={`Delhi garbage report: ${report.addressText}`}
          url={reportUrl}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <DelhiSeverityBadge severity={report.severity} />
            <DelhiStatusBadge status={report.status} />
          </div>

          <div>
            <div className="section-label">Report {report.publicId}</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-ink md:text-5xl">
              {report.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slateblue-700">
              {report.addressText}
            </p>
          </div>

          <Card className="overflow-hidden p-3">
            <img
              src={report.photoUrl}
              alt={report.title}
              className="h-[420px] w-full rounded-[1.5rem] object-cover"
            />
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                Reports
              </div>
              <div className="mt-2 text-3xl font-black text-ink">{report.reporterCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                Days open
              </div>
              <div className="mt-2 text-3xl font-black text-ink">{openDays}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">
                Waste type
              </div>
              <div className="mt-2 text-lg font-black text-ink">{wasteTypeLabels[report.wasteType]}</div>
            </Card>
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="space-y-4 p-5">
            <h2 className="text-xl font-bold text-ink">Accountability</h2>
            <div className="grid gap-3">
              <AccountabilityCard
                title="Civic Body"
                name={report.authority.name ?? "Pending civic authority match"}
                subtitle={report.authority.type}
                href={report.authority.id ? `/authority/${report.authority.id}` : null}
              />
              <AccountabilityCard
                title="Ward or Local Unit"
                name={report.ward.number ? `Ward ${report.ward.number}` : "Ward mapping pending"}
                subtitle={report.ward.name}
                href={report.ward.id ? `/ward/${report.ward.id}` : null}
              />
              <AccountabilityCard
                title="MLA"
                name={report.mla?.name ?? "MLA mapping pending"}
                subtitle={report.assembly.name}
                href={report.mla ? `/mla/${report.mla.id}` : null}
                partyName={report.mla?.partyName}
                partyShortName={report.mla?.partyShortName}
                partyLogoUrl={report.mla?.partyLogoUrl}
              />
              <AccountabilityCard
                title="MP"
                name={report.mp?.name ?? "MP mapping pending"}
                subtitle={report.parliament.name}
                href={report.mp ? `/mp/${report.mp.id}` : null}
                partyName={report.mp?.partyName}
                partyShortName={report.mp?.partyShortName}
                partyLogoUrl={report.mp?.partyLogoUrl}
              />
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-xl font-bold text-ink">Public note</h2>
            <p className="text-sm leading-6 text-slateblue-700">
              First reported on {formatDate(report.createdAt)}. {report.reporterCount} citizen
              {report.reporterCount === 1 ? " has" : "s have"} reported this.
            </p>
            <div className="flex items-center gap-2 text-sm text-slateblue-700">
              <MapPinned className="h-4 w-4 text-civic-700" />
              {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
            </div>
            <div className="flex items-center gap-2 text-sm text-slateblue-700">
              <CalendarDays className="h-4 w-4 text-civic-700" />
              Last updated {formatDate(report.updatedAt)}
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="text-xl font-bold text-ink">Actions</h2>
            <ConfirmReportButton reportId={report.id} initialCount={report.reporterCount} />
            <div className="grid gap-3">
              <Link href={`/report/${report.id}/verify`}>
                <Button variant="secondary" className="w-full">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  It is cleaned up - Verify
                </Button>
              </Link>
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <Button variant="secondary" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  File complaint via WhatsApp
                </Button>
              </a>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
