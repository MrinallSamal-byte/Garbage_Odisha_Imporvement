import { Camera, MapPinned, ShieldCheck } from "lucide-react";

import { LiveReportExperience } from "@/components/report/live-report-experience";

const highlights = [
  { icon: Camera, text: "Use the rear camera first for evidence capture on mobile." },
  { icon: MapPinned, text: "Location is captured from the device and resolved through GIS lookup." },
  { icon: ShieldCheck, text: "The final Delhi form will show civic authority, ward, MLA, and MP before submit." },
];

export default function NewReportPage() {
  return (
    <main className="container py-10">
      <div className="mb-8 space-y-4 text-center">
        <div className="section-label mx-auto">Report garbage</div>
        <h1 className="mx-auto max-w-2xl text-4xl font-black tracking-tight text-ink md:text-5xl">
          Capture a Delhi garbage complaint with live evidence and location-aware routing.
        </h1>
        <p className="mx-auto max-w-xl text-base leading-7 text-slateblue-700">
          The existing live-report flow is being refit to the Delhi data model. The page is now
          mounted on the canonical route for the new platform.
        </p>
        <div className="mx-auto flex max-w-lg flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
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
      <LiveReportExperience />
    </main>
  );
}
