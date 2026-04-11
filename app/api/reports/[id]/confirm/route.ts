import { NextRequest } from "next/server";

import { confirmDelhiReport } from "@/lib/delhi/repository";
import { fail, ok } from "@/lib/utils/http";
import { assertSameOrigin, getClientIp, getSessionFingerprint } from "@/lib/utils/request";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const result = await confirmDelhiReport(id, getSessionFingerprint(request), getClientIp(request));
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
