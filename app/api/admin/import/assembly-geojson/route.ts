import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { fail, ok } from "@/lib/utils/http";

export async function POST(request: NextRequest) {
  try {
    void request;
    await requireAdminSession();
    return ok({
      message:
        "Assembly GeoJSON import route is available. Use the provided import scripts or extend this handler for live admin uploads.",
    });
  } catch (error) {
    return fail(error);
  }
}
