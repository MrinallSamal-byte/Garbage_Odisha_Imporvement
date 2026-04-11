import Link from "next/link";
import { notFound } from "next/navigation";

import { CivicReportCard } from "@/components/civic/civic-report-card";
import { OfficialCard } from "@/components/civic/official-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCivicRepository } from "@/lib/civic/repository";

export const dynamic = "force-dynamic";

type MpPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MpPage({ params }: MpPageProps) {
  const { id } = await params;
  const repository = getCivicRepository();
  const [contacts, reports] = await Promise.all([
    repository.getOfficialContactCards(),
    repository.listReports(),
  ]);
  const leader = contacts.mps.find((item) => item.id === id);

  if (!leader) {
    notFound();
  }

  const leaderReports = reports.filter((item) => item.mp.id === leader.id);
  const activeReports = leaderReports.filter((item) => item.report.status !== "resolved");
  const resolvedReports = leaderReports.filter((item) => item.report.status === "resolved");

  return (
    <main className="container py-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="max-w-3xl space-y-5">
          <div className="section-label">MP profile</div>
          <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">{leader.name}</h1>
          <p className="text-base leading-8 text-slateblue-700">
            {leader.constituencyName}
          </p>
        </div>
        <OfficialCard title="MP" official={leader} />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Active reports" value={activeReports.length} />
        <Stat label="Total reports" value={leaderReports.length} />
        <Stat label="Resolved" value={resolvedReports.length} />
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-black text-ink">Complaints mapped to this MP</h2>
        {leaderReports.length ? (
          <div className="grid gap-4">
            {leaderReports.map((item) => (
              <CivicReportCard key={item.report.id} item={item} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed p-6 text-sm leading-6 text-slateblue-700">
            No complaints are linked to this MP yet.
          </Card>
        )}
      </section>

      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Back to map</Button>
        </Link>
      </div>
    </main>
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
