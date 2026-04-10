import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { ok, fail } from "@/lib/utils/http";
import { assertSameOrigin } from "@/lib/utils/request";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    return ok({
      captureSessionId: randomUUID(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return fail(error);
  }
}
