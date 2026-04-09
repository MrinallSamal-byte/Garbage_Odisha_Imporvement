import { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { AppError } from "@/lib/utils/errors";
import { fail, ok } from "@/lib/utils/http";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getClientIp } from "@/lib/utils/request";
import { submitReportSchema } from "@/lib/validation/schemas";
import { serializeReportDetail } from "@/server/services/report-presentation-service";
import { submitPreviewedReport } from "@/server/services/report-submission-service";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(
      `submit:${ip}`,
      env.RATE_LIMIT_SUBMIT_PER_HOUR,
      60 * 60 * 1000,
    );

    if (!rateLimit.allowed) {
      throw new AppError("Submit rate limit exceeded. Please wait and try again.", 429);
    }

    const body = submitReportSchema.parse(await request.json());
    const detail = await submitPreviewedReport(body);
    return ok({ report: serializeReportDetail(detail) });
  } catch (error) {
    return fail(error);
  }
}
