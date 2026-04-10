import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { fail, ok } from "@/lib/utils/http";
import { resetMockState } from "@/lib/mock/runtime-store";
import { assertSameOrigin } from "@/lib/utils/request";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireAdminSession();
    const state = await resetMockState();
    return ok({
      representatives: state.representatives.length,
      reports: state.reports.length,
    });
  } catch (error) {
    return fail(error);
  }
}
