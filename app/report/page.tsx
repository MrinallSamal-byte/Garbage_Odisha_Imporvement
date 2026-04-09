import { Camera, MapPinned, ShieldCheck } from "lucide-react";

import { LiveReportExperience } from "@/components/report/live-report-experience";

const highlights = [
  "Live camera capture is the default source path.",
  "Exact area lookup comes from device GPS and constituency mapping.",
  "Representative cards are loaded from the database-backed record layer.",
];

export default function ReportPage() {
  return (
    <main className="container py-12">
      <div className="mb-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div className="section-label">Report now</div>
          <h1 className="text-4xl font-black tracking-tight text-ink">Capture a cleanliness complaint with live evidence and exact Odisha routing.</h1>
          <p className="max-w-2xl text-base leading-7 text-slateblue-700">
            Use the camera, allow GPS access, verify the mapped area, review the detected MLA and MP,
            and submit the report to the public dashboard.
          </p>
          <div className="grid gap-3">
            {[
              { icon: Camera, text: highlights[0] },
              { icon: MapPinned, text: highlights[1] },
              { icon: ShieldCheck, text: highlights[2] },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 rounded-[1.5rem] border border-slateblue-100 bg-white/80 px-4 py-4">
                <item.icon className="mt-0.5 h-5 w-5 text-civic-700" />
                <p className="text-sm leading-6 text-slateblue-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <LiveReportExperience />
    </main>
  );
}
