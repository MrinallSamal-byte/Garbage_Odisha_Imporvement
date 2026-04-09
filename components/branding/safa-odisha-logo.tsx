"use client";

import { useId } from "react";

import { cn } from "@/lib/utils/cn";

type SafaOdishaLogoProps = {
  className?: string;
  eyebrow?: string;
  tagline?: string;
  iconOnly?: boolean;
};

export function SafaOdishaLogo({
  className,
  eyebrow = "Odisha civic tech",
  tagline,
  iconOnly = false,
}: SafaOdishaLogoProps) {
  const shellGradientId = useId();
  const pinGradientId = useId();
  const sweepGradientId = useId();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 176 176"
        className={cn("h-12 w-12 shrink-0", iconOnly && "h-11 w-11")}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={shellGradientId} x1="24" x2="152" y1="20" y2="156" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1f8b81" />
            <stop offset="0.52" stopColor="#16726e" />
            <stop offset="1" stopColor="#102f47" />
          </linearGradient>
          <linearGradient id={pinGradientId} x1="88" x2="88" y1="32" y2="152" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59f44" />
            <stop offset="0.42" stopColor="#f37f2f" />
            <stop offset="1" stopColor="#e45c2c" />
          </linearGradient>
          <linearGradient id={sweepGradientId} x1="57" x2="119" y1="64" y2="118" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f3147" />
            <stop offset="1" stopColor="#1f8b81" />
          </linearGradient>
        </defs>

        <rect width="176" height="176" rx="44" fill={`url(#${shellGradientId})`} />
        <path
          d="M28 46C47 28 72 20 98 20C124 20 147 29 160 43V68C144 49 121 38 96 38C70 38 46 49 28 68V46Z"
          fill="#fff6df"
          fillOpacity="0.12"
        />
        <circle cx="134" cy="42" r="12" fill="#fff6df" fillOpacity="0.16" />
        <path
          d="M88 30C55.4 30 29 56.4 29 89C29 108.6 38.5 126.6 54.4 138L88 162L121.6 138C137.5 126.6 147 108.6 147 89C147 56.4 120.6 30 88 30Z"
          fill={`url(#${pinGradientId})`}
        />
        <circle cx="88" cy="89" r="31" fill="#fff7ea" />
        <path
          d="M123 84C116.2 75.4 104.7 71.1 93.9 72.6C101.9 75.6 108.7 81.7 112.2 89.7C106.8 99.8 95.3 106.2 83.7 105.5C75.9 105.1 68.5 101.4 63.2 95.9C64.1 110 75.7 121.2 90 121.2C107.2 121.2 121.2 107.2 121.2 90C121.2 88 120.9 86 120.5 84.1L123 84Z"
          fill={`url(#${sweepGradientId})`}
        />
        <path
          d="M58.6 92.8C62.8 82 73.2 74.5 84.8 74.5C91.4 74.5 97.6 76.9 102.4 81C95.3 80 88 82 82.4 86.4C77.8 89.9 74.4 94.9 72.8 100.5C67.1 99.7 61.9 97.1 58.6 92.8Z"
          fill="#fff7ea"
          fillOpacity="0.9"
        />
        <circle cx="118" cy="62" r="6" fill="#fff7ea" fillOpacity="0.88" />
      </svg>

      {!iconOnly ? (
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-civic-700">
            {eyebrow}
          </div>
          <div className="text-lg font-extrabold tracking-tight text-ink">SafaOdisha</div>
          {tagline ? (
            <div className="text-xs font-medium tracking-[0.02em] text-slateblue-600">{tagline}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
