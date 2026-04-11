import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";

import { SiteMark } from "@/components/branding/site-mark";
import { InstallPwaButton } from "@/components/pwa/install-pwa-button";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/stats", label: "Stats" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link href="/" className="transition hover:opacity-95">
          <SiteMark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={true}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slateblue-700 transition hover:bg-slateblue-50 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <InstallPwaButton />
          <Link
            href="/report/new"
            className="hidden h-9 items-center rounded-full bg-[#d62828] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(214,40,40,0.22)] transition hover:opacity-95 md:inline-flex"
          >
            Report Garbage
          </Link>
          <Link
            href="/search"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-slateblue-100 bg-white px-3 text-sm text-slateblue-500 shadow-sm transition hover:border-civic-200 hover:text-ink"
            aria-label="Search reports and Bhubaneswar accountability records"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search</span>
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-civic-100 bg-civic-50 px-3 py-1 text-xs font-medium text-civic-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              PWA ready
            </span>
          </div>
        </div>
      </div>

      <nav className="container flex gap-2 overflow-x-auto pb-4 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap rounded-full border border-slateblue-100 bg-white px-4 py-2 text-sm font-medium text-slateblue-700",
            )}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/report/new"
          className="shrink-0 rounded-full border border-saffron-200 bg-saffron-50 px-4 py-2 text-sm font-semibold text-saffron-700"
        >
          Report
        </Link>
        <Link
          href="/search"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-slateblue-100 bg-white px-4 py-2 text-sm font-medium text-slateblue-700"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </Link>
      </nav>
    </header>
  );
}
