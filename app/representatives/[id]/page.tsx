import { notFound } from "next/navigation";

import { ReportCard } from "@/components/report/report-card";
import { RepresentativeCard } from "@/components/report/representative-card";
import { Card } from "@/components/ui/card";
import { getRepresentativeProfileData } from "@/server/services/report-query-service";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RepresentativeProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getRepresentativeProfileData(id);

  if (!profile) {
    notFound();
  }

  const items = profile.reports.map(serializeReportListItem);

  return (
    <main className="container py-12">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="section-label">Representative profile</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">{profile.representative.name}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slateblue-700">
            Party affiliation and ruling-party badges are loaded from the representative record layer,
            not hardcoded in the UI.
          </p>
        </Card>
        <Card className="grid gap-4">
          <StatCard label="Area reports" value={String(items.length)} />
          <StatCard label="Unresolved" value={String(profile.unresolvedCount)} />
          <StatCard label="Resolved" value={String(profile.resolvedCount)} />
        </Card>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <RepresentativeCard
          representative={profile.representative}
          constituencyName={
            profile.representative.constituencyType === "ASSEMBLY"
              ? items[0]?.assemblyConstituency?.name ?? null
              : items[0]?.parliamentConstituency?.name ?? null
          }
        />
        <div className="grid gap-5">
          {items.length > 0 ? (
            items.map((item) => <ReportCard key={item.report.id} item={item} />)
          ) : (
            <Card>
              <p className="text-sm text-slateblue-600">No reports are currently linked to this representative.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-slateblue-100 bg-slateblue-50/70 px-4 py-4">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slateblue-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-ink">{value}</div>
    </div>
  );
}
