import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { severityBadgeClasses, severityLabels } from "@/lib/civic/constants";
import { getCivicRepository } from "@/lib/civic/repository";
import { formatWardLabel } from "@/lib/civic/map-view";

export const dynamic = "force-dynamic";

type WardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WardPage({ params }: WardPageProps) {
  const { id } = await params;
  const repository = getCivicRepository();
  const [wards, reports] = await Promise.all([
    repository.listWards(),
    repository.listReports(),
  ]);
  const ward = wards.find((item) => item.id === id);

  if (!ward) {
    notFound();
  }

  const wardReports = reports.filter((item) => item.ward.id === ward.id);
  const activeReports = wardReports.filter((item) => item.report.status !== "resolved");
  const resolvedReports = wardReports.filter((item) => item.report.status === "resolved");

  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">Bhubaneswar ward</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          {formatWardLabel(ward)}
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          BMC zone: {ward.zone}. Reports shown here use the Bhubaneswar civic ward boundary data.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Active reports" value={activeReports.length} />
        <Stat label="Total reports" value={wardReports.length} />
        <Stat label="Resolved" value={resolvedReports.length} />
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-black text-ink">Reports in this ward</h2>
        {wardReports.length ? (
          <div className="grid gap-3">
            {wardReports.map((item) => (
              <Link
                key={item.report.id}
                href={`/report/${item.report.id}`}
                className="grid gap-3 rounded-md border border-slateblue-100 bg-white p-4 transition hover:border-[#e60023]/40 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <h3 className="font-black text-ink">{item.report.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slateblue-700">{item.report.address}</p>
                </div>
                <div className="flex items-center gap-2 sm:block sm:text-right">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${severityBadgeClasses[item.report.severity]}`}>
                    {severityLabels[item.report.severity]}
                  </span>
                  <div className="text-xs font-bold text-slateblue-500 sm:mt-2">
                    {item.report.reporterCount} report{item.report.reporterCount === 1 ? "" : "s"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed p-6 text-sm leading-6 text-slateblue-700">
            No Bhubaneswar reports are linked to this ward yet.
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
