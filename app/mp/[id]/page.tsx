import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountabilityCard } from "@/components/delhi/accountability-card";
import { DelhiReportCard } from "@/components/delhi/delhi-report-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDelhiHomeData, getDelhiLeaderById } from "@/lib/delhi/repository";
import type { DelhiFilters } from "@/lib/delhi/types";

export const dynamic = "force-dynamic";

type MpPageProps = {
  params: Promise<{ id: string }>;
};

function filtersForMp(mp: string): DelhiFilters {
  return {
    view: "list",
    severity: "all",
    status: "all",
    wasteType: "all",
    authority: "",
    ward: "",
    mla: "",
    mp,
    q: "",
  };
}

export default async function MpPage({ params }: MpPageProps) {
  const { id } = await params;

  try {
    const leader = await getDelhiLeaderById(id, "mp");

    if (!leader) {
      notFound();
    }

    const data = await getDelhiHomeData(filtersForMp(leader.id));

    return (
      <main className="container py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="max-w-3xl space-y-5">
            <div className="section-label">MP profile</div>
            <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">{leader.name}</h1>
            <p className="text-base leading-8 text-slateblue-700">
              {leader.constituencyName ?? "Parliamentary constituency assignment pending."}
            </p>
          </div>
          <AccountabilityCard
            title="MP"
            name={leader.name}
            subtitle={leader.constituencyName}
            partyName={leader.partyName}
            partyShortName={leader.partyShortName}
            partyLogoUrl={leader.partyLogoUrl}
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Active reports" value={data.stats.activeReports} />
          <Stat label="Total reports" value={data.stats.totalReports} />
          <Stat label="Resolved" value={data.stats.resolvedReports} />
        </div>

        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-black text-ink">Complaints mapped to this MP</h2>
          {data.reports.length ? (
            <div className="grid gap-4">
              {data.reports.map((report) => (
                <DelhiReportCard key={report.id} report={report} />
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
  } catch (error) {
    return <SetupError message={error instanceof Error ? error.message : "MP page unavailable."} />;
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slateblue-500">{label}</div>
      <div className="mt-2 text-3xl font-black text-ink">{value}</div>
    </Card>
  );
}

function SetupError({ message }: { message: string }) {
  return (
    <main className="container py-12">
      <Card className="max-w-3xl border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950">
        <div className="section-label">MP unavailable</div>
        <h1 className="mt-4 text-3xl font-black tracking-tight">Delhi MP data is not readable yet.</h1>
        <p className="mt-3">{message}</p>
      </Card>
    </main>
  );
}
