import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type WardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function WardPage({ params }: WardPageProps) {
  const { id } = await params;

  return (
    <main className="container py-12">
      <div className="max-w-3xl space-y-5">
        <div className="section-label">Ward</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          Ward route ready for <span className="text-civic-700">{id}</span>.
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          This route will expose ward or ward-equivalent boundaries, authority linkage, MLA and MP
          mapping, and complaint history after the Delhi dataset import is complete.
        </p>
      </div>

      <Card className="mt-8 text-sm leading-6 text-slateblue-700">
        The route shell is now in place so cards and deep links can target `/ward/[id]` without
        another route migration later.
      </Card>

      <div className="mt-8">
        <Link href="/">
          <Button variant="secondary">Back to map</Button>
        </Link>
      </div>
    </main>
  );
}
