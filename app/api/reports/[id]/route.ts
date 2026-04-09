import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/utils/http";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { serializeReportDetail } from "@/server/services/report-presentation-service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const detail = await getReportRepository().getReportDetail(id);

    if (!detail) {
      return ok({ report: null }, { status: 404 });
    }

    return ok({ report: serializeReportDetail(detail) });
  } catch (error) {
    return fail(error);
  }
}
