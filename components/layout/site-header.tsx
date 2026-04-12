import Link from "next/link";

import { SiteMark } from "@/components/branding/site-mark";

export function SiteHeader() {
  return (
    <header className="safe-top shrink-0 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex select-none items-center transition active:scale-95">
          <SiteMark iconOnly />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/representatives/by-location"
            className="hidden rounded-lg bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 sm:inline-flex"
          >
            Detect MLA/MP
          </Link>
          <Link
            href="/about"
            className="text-[10px] font-bold tracking-wide text-gray-300 transition hover:text-gray-400"
          >
            v0.2.1
          </Link>
        </div>
      </div>
    </header>
  );
}
