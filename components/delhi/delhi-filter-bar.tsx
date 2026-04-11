import Link from "next/link";
import { List, Map as MapIcon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { delhiSeverities, delhiStatuses, delhiWasteTypes, severityLabels, statusLabels, wasteTypeLabels } from "@/lib/delhi/constants";
import { buildDelhiQueryString } from "@/lib/delhi/search-params";
import type { CivicAuthorityOption, DelhiFilters } from "@/lib/delhi/types";
import { cn } from "@/lib/utils/cn";

export function DelhiFilterBar({
  filters,
  authorities,
}: {
  filters: DelhiFilters;
  authorities: CivicAuthorityOption[];
}) {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <form className="grid flex-1 gap-3 md:grid-cols-[1.2fr_0.9fr_0.9fr_1fr_1fr_auto]" action="/">
          <input type="hidden" name="view" value={filters.view} />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slateblue-400" />
            <Input
              name="q"
              defaultValue={filters.q}
              placeholder="Search locality, ward, MLA, MP"
              className="pl-9"
              aria-label="Search Delhi reports"
            />
          </div>
          <Select name="severity" defaultValue={filters.severity}>
            <option value="all">All severities</option>
            {delhiSeverities.map((severity) => (
              <option key={severity} value={severity}>
                {severityLabels[severity]}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={filters.status}>
            <option value="all">All statuses</option>
            {delhiStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </Select>
          <Select name="wasteType" defaultValue={filters.wasteType}>
            <option value="all">All waste types</option>
            {delhiWasteTypes.map((wasteType) => (
              <option key={wasteType} value={wasteType}>
                {wasteTypeLabels[wasteType]}
              </option>
            ))}
          </Select>
          <Select name="authority" defaultValue={filters.authority}>
            <option value="">All civic bodies</option>
            {authorities.map((authority) => (
              <option key={authority.id} value={authority.id}>
                {authority.name}
              </option>
            ))}
          </Select>
          <Button type="submit">Filter</Button>
        </form>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slateblue-100 bg-white p-1 shadow-sm">
          <Link
            href={buildDelhiQueryString(filters, { view: "map" })}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition",
              filters.view === "map" ? "bg-ink text-white" : "text-slateblue-700 hover:bg-slateblue-50",
            )}
          >
            <MapIcon className="mr-2 h-4 w-4" />
            Map
          </Link>
          <Link
            href={buildDelhiQueryString(filters, { view: "list" })}
            className={cn(
              "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition",
              filters.view === "list" ? "bg-ink text-white" : "text-slateblue-700 hover:bg-slateblue-50",
            )}
          >
            <List className="mr-2 h-4 w-4" />
            List
          </Link>
        </div>
      </div>
    </Card>
  );
}
