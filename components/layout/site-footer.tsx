import Link from "next/link";

import { SiteMark } from "@/components/branding/site-mark";

const footerLinks = [
  { href: "/report/new", label: "Report a garbage issue" },
  { href: "/", label: "Browse the public map" },
  { href: "/stats", label: "Bhubaneswar analytics" },
  { href: "/about", label: "How it works" },
  { href: "/admin", label: "Admin workspace" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-white/80 backdrop-blur">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <SiteMark
            className="items-start"
            eyebrow="Bhubaneswar accountability platform"
            tagline="Mobile-first garbage reporting with GIS-based routing."
          />
          <h2 className="max-w-md text-2xl font-extrabold tracking-tight text-ink">
            Built for public cleanliness reporting with GPS, GIS, and accountable routing.
          </h2>
          <p className="max-w-lg text-sm leading-6 text-slateblue-700">
            Citizens can capture roadside garbage, map it to the right BMC ward and elected
            representatives, and track public complaints on a shared dashboard.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-civic-700">
            Platform
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slateblue-700">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-ink">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-civic-700">
            Developer
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slateblue-700">
            <a href="/api/digest" target="_blank" rel="noopener noreferrer" className="transition hover:text-ink">
              RSS digest feed
            </a>
            <a href="/api/health" target="_blank" rel="noopener noreferrer" className="transition hover:text-ink">
              Health check
            </a>
            <a href="/api/leaderboard" target="_blank" rel="noopener noreferrer" className="transition hover:text-ink">
              Leaderboard JSON API
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-civic-700">
            Notes
          </h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slateblue-700">
            <p>Jurisdiction lookup is designed to run in DigitalOcean PostgreSQL through PostGIS.</p>
            <p>Bhubaneswar ward data can be replaced with official BMC GeoJSON without changing the UI.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
