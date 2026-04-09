import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { ok, fail } from "@/lib/utils/http";

export async function POST(request: NextRequest) {
  try {
    void request;
    return ok({
      captureSessionId: randomUUID(),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    return fail(error);
  }
}
