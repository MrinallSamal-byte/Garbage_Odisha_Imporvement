import { redirect } from "next/navigation";

import { AdminReportActions } from "@/components/admin/admin-report-actions";
import { ModerationBadge, StatusBadge } from "@/components/report/status-badge";
import { Card } from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const reports = (await getReportRepository().listAdminReports()).map(serializeReportListItem);

  return (
    <main className="container py-12">
      <div className="section-label">Moderation queue</div>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">Review, forward, reject, or resolve incoming reports.</h1>
      <div className="mt-8 grid gap-6">
        {reports.map((item) => (
          <Card key={item.report.id} className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slateblue-500">{item.report.reportCode}</div>
                <h2 className="mt-2 text-2xl font-bold text-ink">{item.report.description}</h2>
                <p className="mt-2 text-sm text-slateblue-700">{item.report.addressLine}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={item.report.status} />
                <ModerationBadge status={item.report.moderationStatus} />
              </div>
            </div>
            <AdminReportActions
              reportId={item.report.id}
              initialStatus={item.report.status}
              initialModeration={item.report.moderationStatus}
            />
          </Card>
        ))}
      </div>
    </main>
  );
}
