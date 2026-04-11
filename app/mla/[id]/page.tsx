import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountabilityCard } from "@/components/delhi/accountability-card";
import { DelhiReportCard } from "@/components/delhi/delhi-report-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDelhiHomeData, getDelhiLeaderById } from "@/lib/delhi/repository";
import type { DelhiFilters } from "@/lib/delhi/types";

export const dynamic = "force-dynamic";

type MlaPageProps = {
  params: Promise<{ id: string }>;
};

function filtersForMla(mla: string): DelhiFilters {
  return {
    view: "list",
    severity: "all",
    status: "all",
    wasteType: "all",
    authority: "",
    ward: "",
    mla,
    mp: "",
    q: "",
  };
}

export default async function MlaPage({ params }: MlaPageProps) {
  const { id } = await params;

  try {
    const leader = await getDelhiLeaderById(id, "mla");

    if (!leader) {
      notFound();
    }

    const data = await getDelhiHomeData(filtersForMla(leader.id));

    return (
      <main className="container py-12">
        <LeaderHeader role="MLA" leader={leader} />
        <Stats data={data} />
        <ReportSection title="Complaints mapped to this MLA" reports={data.reports} />
        <div className="mt-8">
          <Link href="/">
            <Button variant="secondary">Back to map</Button>
          </Link>
        </div>
      </main>
    );
  } catch (error) {
    return <SetupError role="MLA" message={error instanceof Error ? error.message : "MLA page unavailable."} />;
  }
}

function LeaderHeader({
  role,
  leader,
}: {
  role: string;
  leader: NonNullable<Awaited<ReturnType<typeof getDelhiLeaderById>>>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">{role} profile</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">{leader.name}</h1>
        <p className="text-base leading-8 text-slateblue-700">
          {leader.constituencyName ?? "Constituency assignment pending."}
        </p>
      </div>
      <AccountabilityCard
        title={role}
        name={leader.name}
        subtitle={leader.constituencyName}
        partyName={leader.partyName}
        partyShortName={leader.partyShortName}
        partyLogoUrl={leader.partyLogoUrl}
      />
    </div>
  );
}

function Stats({ data }: { data: Awaited<ReturnType<typeof getDelhiHomeData>> }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <Stat label="Active reports" value={data.stats.activeReports} />
      <Stat label="Total reports" value={data.stats.totalReports} />
      <Stat label="Resolved" value={data.stats.resolvedReports} />
    </div>
  );
}

function ReportSection({ title, reports }: { title: string; reports: Awaited<ReturnType<typeof getDelhiHomeData>>["reports"] }) {
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-2xl font-black text-ink">{title}</h2>
      {reports.length ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <DelhiReportCard key={report.id} report={report} />
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

function SetupError({ role, message }: { role: string; message: string }) {
  return (
    <main className="container py-12">
      <Card className="max-w-3xl border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950">
        <div className="section-label">{role} unavailable</div>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Delhi leader data is not readable yet.</h1>
        <p className="mt-3">{message}</p>
      </Card>
    </main>
  );
}
