import { NextRequest } from "next/server";

import { z } from "zod";
import { assertSameOrigin } from "@/lib/utils/request";
import { fail, ok } from "@/lib/utils/http";
import { AppError } from "@/lib/utils/errors";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { serializeReportDetail } from "@/server/services/report-presentation-service";

const reopenSchema = z.object({
  sessionKey: z.string().min(8).max(200),
  reason: z.string().trim().min(10).max(1000),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const body = reopenSchema.parse(await request.json());

    const repo = getReportRepository();
    const detail = await repo.getReportDetail(id);

    if (!detail) {
      throw new AppError("Report not found.", 404);
    }

    if (detail.report.status !== "RESOLVED") {
      throw new AppError("Only resolved reports can be reopened.", 400);
    }

    const updated = await repo.updateStatus(
      id,
      "REPORTED",
      `Citizen re-opened: ${body.reason}`,
      null,
    );

    return ok({ report: serializeReportDetail(updated) });
  } catch (error) {
    return fail(error);
  }
}
