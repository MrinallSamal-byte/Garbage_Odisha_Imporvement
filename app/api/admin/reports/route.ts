import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { fail, ok } from "@/lib/utils/http";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

export async function GET(request: NextRequest) {
  try {
    void request;
    await requireAdminSession();
    const reports = await getReportRepository().listAdminReports();
    return ok({ items: reports.map(serializeReportListItem) });
  } catch (error) {
    return fail(error);
  }
}
