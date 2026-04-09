import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";

import { SafaOdishaLogo } from "@/components/branding/safa-odisha-logo";
import { cn } from "@/lib/utils/cn";

const links = [
  { href: "/", label: "Home" },
  { href: "/report", label: "Report Now" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link href="/" className="transition hover:opacity-95">
          <SafaOdishaLogo />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
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

        <div className="hidden items-center gap-2 lg:flex">
          <Badge icon={<ShieldCheck className="h-4 w-4" />}>
            GPS-first lookup
          </Badge>
          <Badge icon={<Sparkles className="h-4 w-4" />}>AI-assisted review</Badge>
        </div>
      </div>

      <nav className="container flex gap-2 overflow-x-auto pb-4 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full border border-slateblue-100 bg-white px-4 py-2 text-sm font-medium text-slateblue-700",
              link.href === "/report" && "border-saffron-200 bg-saffron-50 text-saffron-700",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function Badge({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-civic-100 bg-civic-50 px-3 py-1 text-sm font-medium text-civic-700">
      {icon}
      <span>{children}</span>
    </div>
  );
}
