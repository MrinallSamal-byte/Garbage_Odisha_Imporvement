import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AuthorityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AuthorityPage({ params }: AuthorityPageProps) {
  const { id } = await params;

  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">Civic authority</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          Authority profile route ready for <span className="text-civic-700">{id}</span>.
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          This page will show Delhi authority metadata, covered areas, related wards, and linked
          complaints once the new DigitalOcean PostGIS schema is live.
        </p>
      </div>

      <Card className="mt-8 space-y-3">
        <h2 className="text-xl font-bold text-ink">Planned sections</h2>
        <p className="text-sm leading-6 text-slateblue-700">
          Authority identity, jurisdiction coverage, active complaints, resolved complaints, and
          linked ward pages.
        </p>
      </Card>

      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Back to map</Button>
        </Link>
      </div>
    </main>
  );
}
