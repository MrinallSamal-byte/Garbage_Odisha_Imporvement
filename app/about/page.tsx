import Link from "next/link";
import { ArrowRight, MapPinned, ShieldCheck, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    title: "Camera-first reports",
    description:
      "People should be able to capture roadside garbage directly from the phone camera and submit it in one short flow.",
    icon: Trash2,
  },
  {
    title: "Delhi jurisdiction mapping",
    description:
      "Each point should resolve to the right civic authority, ward or equivalent, assembly constituency, and parliamentary constituency.",
    icon: MapPinned,
  },
  {
    title: "Public accountability",
    description:
      "Every report should show the responsible public offices and let the community confirm, share, and verify cleanup.",
    icon: ShieldCheck,
  },
];

export default function AboutPage() {
  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">How it works</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          Delhi-wide garbage reporting with jurisdiction-aware public routing.
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          This platform is being upgraded into a Delhi-wide civic reporting app that maps every
          complaint to the correct civic authority, ward or equivalent, MLA, and MP using GIS
          boundaries stored in the primary DigitalOcean PostgreSQL database.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-civic-50 text-civic-700">
              <pillar.icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-ink">{pillar.title}</h2>
            <p className="text-sm leading-6 text-slateblue-700">{pillar.description}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 space-y-4">
        <h2 className="text-xl font-bold text-ink">Privacy and moderation</h2>
        <p className="text-sm leading-6 text-slateblue-700">
          Reports are anonymous by default. Public pages show complaint evidence and civic routing,
          not private reporter identity. Verification uploads and moderation history remain in the
          main database for auditability.
        </p>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/report/new">
          <Button>
            Report now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">View map</Button>
        </Link>
      </div>
    </main>
  );
}
