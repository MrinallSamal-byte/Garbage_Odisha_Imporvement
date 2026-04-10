import Link from "next/link";
import { Camera, CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type VerifyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VerifyReportPage({ params }: VerifyPageProps) {
  const { id } = await params;

  return (
    <main className="container py-12">
      <div className="max-w-2xl space-y-5">
        <div className="section-label">Cleanup verification</div>
        <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
          Submit fresh proof that this location has been cleaned.
        </h1>
        <p className="text-base leading-8 text-slateblue-700">
          Report <span className="font-semibold text-ink">{id}</span> will move to pending
          verification once this route is connected to the new moderation flow.
        </p>
      </div>

      <Card className="mt-8 space-y-4">
        <div className="flex items-center gap-3">
          <Camera className="h-5 w-5 text-civic-700" />
          <div className="text-sm font-semibold text-ink">Upload fresh proof photo</div>
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="block w-full rounded-2xl border border-dashed border-slateblue-200 bg-slateblue-50/50 px-4 py-5 text-sm text-slateblue-700"
          aria-label="Upload cleanup proof photo"
        />
        <textarea
          className="min-h-28 w-full rounded-2xl border border-slateblue-200 px-4 py-3 text-sm text-ink"
          placeholder="Optional cleanup note"
          aria-label="Optional cleanup note"
        />
        <div className="flex flex-wrap gap-3">
          <Button>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Submit verification
          </Button>
          <Link href={`/report/${id}`}>
            <Button variant="secondary">Cancel</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
