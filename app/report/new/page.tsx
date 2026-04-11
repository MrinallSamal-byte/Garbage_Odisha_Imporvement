import { Camera, MapPinned, ShieldCheck } from "lucide-react";

import { DelhiReportForm } from "@/components/delhi/delhi-report-form";

const highlights = [
  { icon: Camera, text: "Take a live photo or upload a clear image." },
  { icon: MapPinned, text: "Use GPS to resolve Delhi jurisdiction mapping." },
  { icon: ShieldCheck, text: "Review civic authority, ward, MLA, and MP before submitting." },
];

export default function NewReportPage() {
  return (
    <main className="container py-10">
      <div className="mb-8 space-y-4 text-center">
        <div className="section-label mx-auto">Report garbage</div>
        <h1 className="mx-auto max-w-2xl text-4xl font-black tracking-tight text-ink md:text-5xl">
          Submit a Delhi garbage report without logging in.
        </h1>
        <p className="mx-auto max-w-xl text-base leading-7 text-slateblue-700">
          Capture evidence, share your location, add address clues, and publish a report mapped to
          Delhi civic accountability records.
        </p>
        <div className="mx-auto flex max-w-3xl flex-col gap-2 pt-2 md:flex-row md:justify-center">
          {highlights.map((item) => (
            <div
              key={item.text}
              className="flex items-start gap-2 rounded-2xl border border-slateblue-100 bg-white/80 px-3 py-2.5 text-left text-xs text-slateblue-700"
            >
              <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-civic-600" />
              {item.text}
            </div>
          ))}
        </div>
      </div>
      <DelhiReportForm />
    </main>
  );
}
