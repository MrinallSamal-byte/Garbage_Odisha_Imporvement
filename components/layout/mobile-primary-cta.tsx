"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Camera } from "lucide-react";

export function MobilePrimaryCta() {
  const pathname = usePathname();

  if (
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname === "/" ||
    pathname === "/report" ||
    pathname === "/report/new"
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pt-3 md:hidden">
      <div className="pointer-events-auto rounded-[1.75rem] border border-white/80 bg-white/90 p-3 shadow-[0_-12px_30px_rgba(15,49,71,0.12)] backdrop-blur-xl">
        <div className="grid grid-cols-[1.45fr_0.8fr] gap-3">
          <Link
            href="/report/new"
            className="inline-flex h-14 items-center justify-center rounded-full bg-[#d62828] px-5 text-base font-semibold text-white shadow-[0_14px_30px_rgba(214,40,40,0.28)] transition active:scale-[0.99]"
          >
            <Camera className="mr-2 h-4 w-4" />
            Report Garbage
          </Link>
          <Link
            href="/stats"
            className="inline-flex h-14 items-center justify-center rounded-full border border-slateblue-200 bg-white text-sm font-semibold text-slateblue-700 transition active:scale-[0.99]"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Stats
          </Link>
        </div>
      </div>
    </div>
  );
}
