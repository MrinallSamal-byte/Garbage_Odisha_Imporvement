import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { adminStatusSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/utils/http";
import { assertSameOrigin } from "@/lib/utils/request";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { serializeReportDetail } from "@/server/services/report-presentation-service";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    assertSameOrigin(request);
    const session = await requireAdminSession();
    const { id } = await params;
    const body = adminStatusSchema.parse(await request.json());
    const detail = await getReportRepository().updateStatus(id, body.status, body.note, session.userId);
    return ok({ report: serializeReportDetail(detail) });
  } catch (error) {
    return fail(error);
  }
}
