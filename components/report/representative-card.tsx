import Link from "next/link";
import { Mail, Phone, Globe } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Representative } from "@/types/domain";

export function RepresentativeCard({
  representative,
  constituencyName,
}: {
  representative: Representative | null;
  constituencyName: string | null;
}) {
  if (!representative) {
    return (
      <Card className="border-dashed">
        <p className="text-sm text-slateblue-600">No active representative record mapped for this constituency yet.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-civic-700">
            {representative.representativeType}
          </p>
          <h3 className="mt-2 text-xl font-bold text-ink">{representative.name}</h3>
          <p className="mt-1 text-sm text-slateblue-700">{representative.partyName}</p>
        </div>
        <div className="flex flex-col gap-2 text-right">
          {representative.isStateRulingParty ? <Badge variant="civic">State ruling</Badge> : null}
          {representative.isCentralRulingParty ? <Badge variant="warning">Central ruling</Badge> : null}
        </div>
      </div>
      <div className="grid gap-3 text-sm text-slateblue-700">
        <div>
          <div className="font-semibold text-ink">Constituency</div>
          <div>{constituencyName ?? "Not assigned"}</div>
        </div>
        {representative.contactEmail ? (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-civic-600" />
            <span>{representative.contactEmail}</span>
          </div>
        ) : null}
        {representative.contactPhone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-civic-600" />
            <span>{representative.contactPhone}</span>
          </div>
        ) : null}
        {representative.websiteUrl ? (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-civic-600" />
            <a
              href={representative.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-civic-300 underline-offset-4"
            >
              Official website
            </a>
          </div>
        ) : null}
      </div>
      <Link
        href={`/representatives/${representative.id}`}
        className="inline-flex text-sm font-semibold text-civic-700 underline decoration-civic-300 underline-offset-4"
      >
        View profile
      </Link>
    </Card>
  );
}
