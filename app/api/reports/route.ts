import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/utils/http";
import { reportFiltersSchema } from "@/lib/validation/schemas";
import { getDashboardData } from "@/server/services/report-query-service";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = Object.fromEntries(request.nextUrl.searchParams.entries());
    const filters = reportFiltersSchema.parse(query);
    const { reports, stats, total } = await getDashboardData(filters);

    return ok({
      stats,
      items: reports.map(serializeReportListItem),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    });
  } catch (error) {
    return fail(error);
  }
}
