import Link from "next/link";

const footerLinks = [
  { href: "/report", label: "Report a cleanliness issue" },
  { href: "/dashboard", label: "Browse public dashboard" },
  { href: "/admin", label: "Admin workspace" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-white/80 backdrop-blur">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="section-label">SafaOdisha</p>
          <h2 className="max-w-md text-2xl font-extrabold tracking-tight text-ink">
            Built for public cleanliness reporting with GPS, GIS, and accountable routing.
          </h2>
          <p className="max-w-lg text-sm leading-6 text-slateblue-700">
            Citizens can capture live evidence, map it to the correct Odisha constituencies, and
            surface unresolved civic issues on a public dashboard.
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
            Notes
          </h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slateblue-700">
            <p>Exact representative lookup comes from GIS point-in-polygon mapping, not image-only AI.</p>
            <p>Mock mode is provided for local development where PostGIS is not yet available.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
