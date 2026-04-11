import Link from "next/link";
import { notFound } from "next/navigation";

import { CivicReportCard } from "@/components/civic/civic-report-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCivicRepository } from "@/lib/civic/repository";

export const dynamic = "force-dynamic";

type AuthorityPageProps = {
  params: Promise<{ id: string }>;
};

const bmcAuthorityIds = new Set([
  "bmc",
  "bhubaneswar",
  "bhubaneswar-municipal-corporation",
  "bhubaneswar-municipal-corporation-bmc",
]);

export default async function AuthorityPage({ params }: AuthorityPageProps) {
  const { id } = await params;
  const normalizedId = id.trim().toLowerCase();

  if (!bmcAuthorityIds.has(normalizedId)) {
    notFound();
  }

  const repository = getCivicRepository();
  const [reports, wards] = await Promise.all([
    repository.listReports(),
    repository.listWards(),
  ]);
  const activeReports = reports.filter((item) => item.report.status !== "resolved");
  const resolvedReports = reports.filter((item) => item.report.status === "resolved");
  const zones = new Set(wards.map((ward) => ward.zone));

  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">Civic authority</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          Bhubaneswar Municipal Corporation
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          BMC complaint accountability page for Bhubaneswar ward reports.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Active reports" value={activeReports.length} />
        <Stat label="Total reports" value={reports.length} />
        <Stat label="Resolved" value={resolvedReports.length} />
        <Stat label="Mapped zones" value={zones.size} />
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-black text-ink">Complaints under BMC</h2>
        {reports.length ? (
          <div className="grid gap-4">
            {reports.map((item) => (
              <CivicReportCard key={item.report.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState />
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

function EmptyState() {
  return (
    <Card className="border-dashed p-6 text-sm leading-6 text-slateblue-700">
      No complaints are linked to this authority yet.
      <span className="block pt-2">Submit a Bhubaneswar report to populate this page.</span>
    </Card>
  );
}
