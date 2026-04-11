import Link from "next/link";

import { Card } from "@/components/ui/card";

export function AccountabilityCard({
  title,
  name,
  subtitle,
  href,
  partyName,
  partyShortName,
  partyLogoUrl,
}: {
  title: string;
  name: string;
  subtitle?: string | null;
  href?: string | null;
  partyName?: string | null;
  partyShortName?: string | null;
  partyLogoUrl?: string | null;
}) {
  const content = (
    <Card className="h-full space-y-3 p-4 transition hover:border-civic-200">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-civic-700">{title}</div>
      <div className="flex items-start gap-3">
        {partyLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={partyLogoUrl}
            alt={partyName ?? partyShortName ?? name}
            className="h-11 w-11 rounded-full border border-slateblue-100 bg-white object-contain p-1"
          />
        ) : null}
        <div>
          <div className="font-black text-ink">{name}</div>
          {subtitle ? <div className="mt-1 text-sm leading-5 text-slateblue-700">{subtitle}</div> : null}
          {partyName || partyShortName ? (
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slateblue-500">
              {partyShortName ?? partyName}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
