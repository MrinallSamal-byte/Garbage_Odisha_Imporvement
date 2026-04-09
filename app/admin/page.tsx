import Link from "next/link";
import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth/admin-session";
import { getAdminOverview } from "@/server/services/admin-service";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin/reports", label: "Moderation queue" },
  { href: "/admin/representatives", label: "Representative records" },
  { href: "/admin/imports", label: "GIS imports" },
];

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const overview = await getAdminOverview();

  return (
    <main className="container py-12">
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <div className="section-label">Admin workspace</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink">Moderate reports, manage representatives, and keep the Odisha GIS layer current.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slateblue-700">
            Signed in as {session.email}. Use the panels below to update statuses, review suspicious
            reports, and refresh representative records.
          </p>
        </Card>
        <Card className="grid gap-3">
          <StatCard label="Reports" value={String(overview.stats.totalReports)} />
          <StatCard label="Representatives" value={String(overview.representatives.length)} />
          <StatCard label="Unresolved" value={String(overview.stats.unresolvedReports)} />
        </Card>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {links.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-civic">
              <div className="text-lg font-bold text-ink">{item.label}</div>
              <p className="mt-2 text-sm leading-6 text-slateblue-700">
                Open the {item.label.toLowerCase()} panel.
              </p>
            </Card>
          </Link>
        ))}
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
