import Link from "next/link";
import { notFound } from "next/navigation";

import { CivicReportCard } from "@/components/civic/civic-report-card";
import { OfficialCard } from "@/components/civic/official-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCivicRepository } from "@/lib/civic/repository";
import type { OfficialBoundary, ReportListItem } from "@/lib/civic/types";

export const dynamic = "force-dynamic";

type MlaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MlaPage({ params }: MlaPageProps) {
  const { id } = await params;
  const repository = getCivicRepository();
  const [contacts, reports] = await Promise.all([
    repository.getOfficialContactCards(),
    repository.listReports(),
  ]);
  const leader = contacts.mlas.find((item) => item.id === id);

  if (!leader) {
    notFound();
  }

  const leaderReports = reports.filter((item) => item.mla.id === leader.id);

  return (
    <main className="container py-12">
      <LeaderHeader role="MLA" leader={leader} />
      <Stats reports={leaderReports} />
      <ReportSection title="Complaints mapped to this MLA" reports={leaderReports} />
      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Back to map</Button>
        </Link>
      </div>
    </main>
  );
}

function LeaderHeader({
  role,
  leader,
}: {
  role: string;
  leader: OfficialBoundary;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">{role} profile</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">{leader.name}</h1>
        <p className="text-base leading-8 text-slateblue-700">
          {leader.constituencyName}
        </p>
      </div>
      <OfficialCard title={role} official={leader} />
    </div>
  );
}

function Stats({ reports }: { reports: ReportListItem[] }) {
  const activeReports = reports.filter((item) => item.report.status !== "resolved");
  const resolvedReports = reports.filter((item) => item.report.status === "resolved");

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <Stat label="Active reports" value={activeReports.length} />
      <Stat label="Total reports" value={reports.length} />
      <Stat label="Resolved" value={resolvedReports.length} />
    </div>
  );
}

function ReportSection({ title, reports }: { title: string; reports: ReportListItem[] }) {
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-2xl font-black text-ink">{title}</h2>
      {reports.length ? (
        <div className="grid gap-4">
          {reports.map((item) => (
            <CivicReportCard key={item.report.id} item={item} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed p-6 text-sm leading-6 text-slateblue-700">
          No complaints are linked to this leader yet.
        </Card>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-ink">{value}</div>
    </Card>
  );
}
