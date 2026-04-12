import { PoliticalLocationDetector } from "@/components/civic/political-location-detector";

export const dynamic = "force-dynamic";

export default function RepresentativesByLocationPage() {
  return (
    <main className="container py-8 md:py-12">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="space-y-4">
          <div className="section-label">Location lookup</div>
          <h1 className="text-4xl font-black tracking-tight text-ink md:text-5xl">
            Find the responsible representatives for your area.
          </h1>
          <p className="text-base leading-8 text-slateblue-700">
            The result is marked exact only when a constituency polygon contains your GPS point. Otherwise the lookup uses ward, gram panchayat, and locality evidence with confidence notes.
          </p>
        </section>

        <PoliticalLocationDetector />
      </div>
    </main>
  );
}
