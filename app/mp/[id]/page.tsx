import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type MpPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MpPage({ params }: MpPageProps) {
  const { id } = await params;

  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">MP profile</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          MP route ready for <span className="text-civic-700">{id}</span>.
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          This page will show parliamentary accountability, party identity, covered Delhi areas,
          and linked complaints after the new constituency and leader tables are populated.
        </p>
      </div>

      <Card className="mt-8 text-sm leading-6 text-slateblue-700">
        The route exists now so report detail cards can target the final MP path immediately.
      </Card>

      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Back to map</Button>
        </Link>
      </div>
    </main>
  );
}
