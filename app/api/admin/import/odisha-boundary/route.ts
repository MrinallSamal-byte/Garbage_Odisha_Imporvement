import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { fail, ok } from "@/lib/utils/http";
import { assertSameOrigin } from "@/lib/utils/request";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireAdminSession();
    return ok({
      message:
        "Boundary import route is available. Use the provided import scripts or extend this handler for live admin uploads.",
    });
  } catch (error) {
    return fail(error);
  }
}
