import { cn } from "@/lib/utils/cn";

type SiteMarkProps = {
  className?: string;
  eyebrow?: string;
  tagline?: string;
  iconOnly?: boolean;
};

export function SiteMark({
  className,
  eyebrow = "Bhubaneswar civic reporting",
  tagline = "Crowdsourced garbage reporting with GIS accountability.",
  iconOnly = false,
}: SiteMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/namma-odia-logo.png"
        alt="Namma Odia"
        className={cn(
          "h-11 w-auto rounded-md object-contain shadow-sm",
          iconOnly && "h-12 max-w-36",
        )}
      />
      {!iconOnly ? (
        <span className="sr-only">
          Namma Odia. {eyebrow}. {tagline}
        </span>
      ) : null}
    </div>
  );
}
