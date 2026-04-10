import Link from "next/link";
import { BarChart3, Building2, MapPinned, ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statPlaceholders = [
  {
    title: "Total reports",
    body: "Delhi-wide totals will be computed from DigitalOcean PostgreSQL views and RPC queries.",
    icon: BarChart3,
  },
  {
    title: "Authority breakdown",
    body: "MCD, NDMC, and special jurisdiction coverage will be compared side by side.",
    icon: Building2,
  },
  {
    title: "Hotspot wards",
    body: "Top wards or equivalent local areas will be ranked by active complaint count.",
    icon: MapPinned,
  },
  {
    title: "Critical cases",
    body: "Severity trends will be exposed as shareable links back to filtered public views.",
    icon: ShieldAlert,
  },
];

export default function StatsPage() {
  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">Stats</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          Delhi analytics and accountability trends.
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          This route is reserved for the Delhi-wide stats dashboard. The page shell is now in
          place; the live aggregates will be connected once the Delhi schema is applied on the
          PostGIS-enabled DigitalOcean cluster.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {statPlaceholders.map((item) => (
          <Card key={item.title} className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-50 text-saffron-700">
              <item.icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-ink">{item.title}</h2>
            <p className="text-sm leading-6 text-slateblue-700">{item.body}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Back to map</Button>
        </Link>
      </div>
    </main>
  );
}
