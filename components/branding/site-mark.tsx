import { MapPinned } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type SiteMarkProps = {
  className?: string;
  eyebrow?: string;
  tagline?: string;
  iconOnly?: boolean;
};

export function SiteMark({
  className,
  eyebrow = "Delhi civic reporting",
  tagline = "Crowdsourced garbage reporting with GIS accountability.",
  iconOnly = false,
}: SiteMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white shadow-card">
        <MapPinned className="h-5 w-5" />
      </div>
      {!iconOnly ? (
        <div className="space-y-0.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-civic-700">
            {eyebrow}
          </div>
          <div className="text-lg font-extrabold tracking-tight text-ink">Delhi Garbage Watch</div>
          <div className="text-xs text-slateblue-600">{tagline}</div>
        </div>
      ) : null}
    </div>
  );
}
