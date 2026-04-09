/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";

import { LazyReportsMap } from "@/components/maps/lazy-reports-map";
import { CommentComposer } from "@/components/report/comment-composer";
import { RepresentativeCard } from "@/components/report/representative-card";
import { ModerationBadge, StatusBadge } from "@/components/report/status-badge";
import { SupportButton } from "@/components/report/support-button";
import { TrustScoreBadge } from "@/components/report/trust-score-badge";
import { ShareReportButton } from "@/components/report/share-report-button";
import { Card } from "@/components/ui/card";
import { env } from "@/lib/env";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { serializeReportDetail } from "@/server/services/report-presentation-service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getReportRepository().getReportDetail(id);

  if (!detail) {
    notFound();
  }

  const report = serializeReportDetail(detail);
  const leadImage = report.media[0];

  return (
    <main className="container py-12">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={report.report.status} />
            <ModerationBadge status={report.report.moderationStatus} />
            <TrustScoreBadge score={report.report.trustScore} />
          </div>
          <div>
            <div className="section-label">Report {report.report.reportCode}</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">{report.report.description}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slateblue-700">{report.report.addressLine}</p>
          </div>
          <Card className="overflow-hidden p-3">
            {leadImage?.previewUrl ? (
              <img
                src={leadImage.previewUrl}
                alt={report.report.description}
                className="h-[420px] w-full rounded-[1.5rem] object-cover"
              />
            ) : null}
          </Card>
          <Card className="p-4">
            <LazyReportsMap
              height={320}
              markers={[
                {
                  id: report.report.id,
                  latitude: report.report.latitude,
                  longitude: report.report.longitude,
                  title: report.report.reportCode,
                  subtitle: report.report.addressLine,
                },
              ]}
            />
          </Card>
          <Card className="space-y-4">
            <h2 className="text-xl font-bold text-ink">Status timeline</h2>
            <div className="space-y-4">
              {report.timeline.map((entry) => (
                <div key={entry.id} className="rounded-[1.25rem] border border-slateblue-100 bg-slateblue-50/60 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-ink">{entry.newStatus.replaceAll("_", " ")}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slateblue-500">
                      {new Date(entry.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slateblue-700">{entry.note}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-xl font-bold text-ink">Area routing</h2>
            <div className="grid gap-3 text-sm text-slateblue-700">
              <div>
                <span className="font-semibold text-ink">District:</span> {report.district?.name ?? "Unknown"}
              </div>
              <div>
                <span className="font-semibold text-ink">Assembly constituency:</span>{" "}
                {report.assemblyConstituency?.name ?? "Unmapped"}
              </div>
              <div>
                <span className="font-semibold text-ink">Parliament constituency:</span>{" "}
                {report.parliamentConstituency?.name ?? "Unmapped"}
              </div>
              <div>
                <span className="font-semibold text-ink">GPS accuracy:</span>{" "}
                {Math.round(report.report.gpsAccuracyMeters)} m
              </div>
            </div>
            <SupportButton reportId={report.report.id} initialCount={report.votes} />
            <ShareReportButton
              reportCode={report.report.reportCode}
              addressLine={report.report.addressLine}
              reportUrl={`${env.NEXT_PUBLIC_APP_URL}/reports/${report.report.id}`}
            />
          </Card>

          <RepresentativeCard
            representative={report.mla}
            constituencyName={report.assemblyConstituency?.name ?? null}
          />
          <RepresentativeCard
            representative={report.mp}
            constituencyName={report.parliamentConstituency?.name ?? null}
          />

          <Card className="space-y-4">
            <h2 className="text-xl font-bold text-ink">AI verification summary</h2>
            <div className="space-y-2 text-sm leading-6 text-slateblue-700">
              <p>
                Issue type: <strong>{report.report.aiSummaryJson.issueType}</strong>
              </p>
              <p>
                Confidence: <strong>{Math.round(report.report.aiSummaryJson.confidenceScore * 100)}%</strong>
              </p>
              <p>
                GPS-image consistency: <strong>{report.report.aiSummaryJson.gpsImageConsistency}</strong>
              </p>
              <p>{report.report.aiSummaryJson.moderationNotes}</p>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-xl font-bold text-ink">Public comments</h2>
            <CommentComposer reportId={report.report.id} />
            <div className="space-y-3">
              {report.commentItems.map((comment) => (
                <div key={comment.id} className="rounded-[1.25rem] border border-slateblue-100 bg-slateblue-50/60 px-4 py-4">
                  <div className="font-semibold text-ink">{comment.displayName}</div>
                  <div className="mt-2 text-sm leading-6 text-slateblue-700">{comment.body}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
