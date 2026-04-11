/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { OfficialBoundary } from "@/lib/civic/types";

export function OfficialCard({
  title,
  official,
  href,
}: {
  title: string;
  official: OfficialBoundary;
  href?: string;
}) {
  const content = (
    <Card className="h-full space-y-3 p-4 transition hover:border-civic-200">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-civic-700">{title}</div>
      <div className="flex items-start gap-3">
        {official.partyLogoUrl ? (
          <img
            src={official.partyLogoUrl}
            alt={official.party}
            className="h-11 w-11 rounded-full border border-slateblue-100 bg-white object-contain p-1"
          />
        ) : null}
        <div>
          <div className="font-black text-ink">{official.name}</div>
          <div className="mt-1 text-sm leading-5 text-slateblue-700">
            {official.constituencyName}
          </div>
          <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slateblue-500">
            {official.partyAcronym || official.party}
          </div>
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
