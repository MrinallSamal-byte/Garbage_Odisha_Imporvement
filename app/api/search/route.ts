import { NextRequest } from "next/server";

import { z } from "zod";
import { fail, ok } from "@/lib/utils/http";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { getRepresentativeRepository } from "@/server/repositories/repository-factory";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

export const dynamic = "force-dynamic";

const searchSchema = z.object({
  q: z.string().trim().min(2).max(200),
  type: z.enum(["reports", "representatives", "all"]).default("all"),
});

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesQuery(fields: (string | null | undefined)[], query: string) {
  const q = normalize(query);
  return fields.some((f) => f && normalize(f).includes(q));
}

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const { q, type } = searchSchema.parse(raw);

    const [reportResults, representativeResults] = await Promise.all([
      type === "representatives"
        ? Promise.resolve([])
        : getReportRepository()
            .listPublicReports()
            .then((items) =>
              items
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
                .map(serializeReportListItem),
            ),

      type === "reports"
        ? Promise.resolve([])
        : getRepresentativeRepository()
            .listRepresentatives()
            .then((reps) =>
              reps.filter((rep) =>
                matchesQuery([rep.name, rep.partyName, rep.officialRoleTitle, rep.contactEmail], q),
              ),
            ),
    ]);

    return ok({
      query: q,
      reports: reportResults,
      representatives: representativeResults,
      total: reportResults.length + representativeResults.length,
    });
  } catch (error) {
    return fail(error);
  }
}
