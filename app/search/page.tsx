import Link from "next/link";
import { Search, MapPin, Users } from "lucide-react";

import { ReportCard } from "@/components/report/report-card";
import { RepresentativeCard } from "@/components/report/representative-card";
import { Card } from "@/components/ui/card";
import { getReportRepository, getRepresentativeRepository } from "@/server/repositories/repository-factory";
import { serializeReportListItem } from "@/server/services/report-presentation-service";
import type { Representative } from "@/types/domain";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesQuery(fields: (string | null | undefined)[], query: string) {
  const q = normalize(query);
  return fields.some((f) => f && normalize(f).includes(q));
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q.trim() : "";

  let reportResults: ReturnType<typeof serializeReportListItem>[] = [];
  let representativeResults: Representative[] = [];

  if (q.length >= 2) {
    const [reports, reps] = await Promise.all([
      getReportRepository().listPublicReports(),
      getRepresentativeRepository().listRepresentatives(),
    ]);

    reportResults = reports
      .filter((item) =>
        matchesQuery(
          [
            item.report.description,
            item.report.addressLine,
            item.report.locality,
            item.report.reportCode,
            item.district?.name,
            item.assemblyConstituency?.name,
            item.parliamentConstituency?.name,
            item.mla?.name,
            item.mp?.name,
          ],
          q,
        ),
      )
      .slice(0, 20)
      .map(serializeReportListItem);

    representativeResults = reps
      .filter((rep) =>
        matchesQuery([rep.name, rep.partyName, rep.officialRoleTitle, rep.contactEmail], q),
      )
      .slice(0, 10);
  }

  const total = reportResults.length + representativeResults.length;

  return (
    <main className="container py-12">
      <div className="mx-auto max-w-2xl">
        <div className="section-label">Search</div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-ink">
          Search reports and representatives
        </h1>
        <p className="mt-3 text-base text-slateblue-600">
          Search by description, address, locality, district, constituency, or representative name.
        </p>

        <form method="GET" action="/search" className="mt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slateblue-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="e.g. Nayapalli, garbage, Bhubaneswar MLA…"
                autoFocus
                className="h-12 w-full rounded-full border border-slateblue-100 bg-white pl-11 pr-4 text-sm text-ink shadow-sm outline-none transition placeholder:text-slateblue-400 focus:border-civic-300 focus:ring-2 focus:ring-civic-100"
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-civic-800"
            >
              Search
            </button>
          </div>
        </form>

        {q.length >= 2 && (
          <p className="mt-4 text-sm text-slateblue-500">
            {total === 0
              ? `No results for "${q}"`
              : `${total} result${total !== 1 ? "s" : ""} for "${q}"`}
          </p>
        )}
      </div>

      {q.length >= 2 && total > 0 && (
        <div className="mt-10 space-y-10">
          {representativeResults.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-civic-600" />
                <h2 className="text-xl font-bold text-ink">
                  Representatives ({representativeResults.length})
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {representativeResults.map((rep) => (
                  <RepresentativeCard
                    key={rep.id}
                    representative={rep}
                    constituencyName={null}
                  />
                ))}
              </div>
            </section>
          )}

          {reportResults.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-civic-600" />
                <h2 className="text-xl font-bold text-ink">
                  Reports ({reportResults.length})
                </h2>
              </div>
              <div className="grid gap-5">
                {reportResults.map((item) => (
                  <ReportCard key={item.report.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {q.length >= 2 && total === 0 && (
        <div className="mx-auto mt-12 max-w-md text-center">
          <Card className="border-dashed">
            <p className="text-sm text-slateblue-600">
              No reports or representatives matched{" "}
              <strong className="text-ink">&ldquo;{q}&rdquo;</strong>. Try a different keyword,
              district name, or locality.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex text-sm font-semibold text-civic-700 underline underline-offset-4"
            >
              Browse all reports on the dashboard
            </Link>
          </Card>
        </div>
      )}

      {!q && (
        <div className="mx-auto mt-12 max-w-lg">
          <Card className="space-y-4">
            <h2 className="font-bold text-ink">Search tips</h2>
            <ul className="space-y-2 text-sm text-slateblue-700">
              {[
                "Type a locality name like "Nayapalli" or "Cuttack Sadar"",
                "Search a district name like "Khordha" or "Puri"",
                "Look up an MLA or MP by name",
                "Use an issue type like "drain", "overflow", or "roadside dump"",
                "Paste a report code like "SOD-20260409-001"",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-0.5 text-civic-400">→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </main>
  );
}
