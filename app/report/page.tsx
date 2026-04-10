import { Camera, MapPinned, ShieldCheck } from "lucide-react";

import { LiveReportExperience } from "@/components/report/live-report-experience";

const highlights = [
  { icon: Camera, text: "Live camera capture is the default, highest-trust source path." },
  { icon: MapPinned, text: "Exact area lookup comes from device GPS — not inferred from the image." },
  { icon: ShieldCheck, text: "Representative cards are loaded from the live GIS-backed record layer." },
];

export default function ReportPage() {
  return (
    <main className="container py-10">
      <div className="mb-8 space-y-4 text-center">
        <div className="section-label mx-auto">Report now</div>
        <h1 className="mx-auto max-w-2xl text-4xl font-black tracking-tight text-ink md:text-5xl">
          Capture a cleanliness complaint with live evidence and exact Odisha routing.
        </h1>
        <p className="mx-auto max-w-xl text-base leading-7 text-slateblue-700">
          Take a live photo, allow GPS access, review the mapped MLA and MP, and publish to the
          public dashboard.
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
