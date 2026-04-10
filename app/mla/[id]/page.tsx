import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type MlaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MlaPage({ params }: MlaPageProps) {
  const { id } = await params;

  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">MLA profile</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          MLA route ready for <span className="text-civic-700">{id}</span>.
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          The Delhi platform will use this route for assembly constituency accountability, linked
          wards, complaint totals, party branding, and official contact details.
        </p>
      </div>

      <Card className="mt-8 text-sm leading-6 text-slateblue-700">
        The canonical profile route now exists. The live data binding depends on the Delhi leaders
        and assignment imports.
      </Card>

      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Back to map</Button>
        </Link>
      </div>
    </main>
  );
}
