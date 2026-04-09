import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { fail, ok } from "@/lib/utils/http";
import { resetMockState } from "@/lib/mock/runtime-store";

export async function POST(request: NextRequest) {
  try {
    void request;
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
