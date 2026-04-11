import { NextRequest } from "next/server";

import { getCivicRepository } from "@/lib/civic/repository";
import { fail, ok } from "@/lib/utils/http";
import { assertSameOrigin } from "@/lib/utils/request";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const reporterCount = await getCivicRepository().incrementReporterCount(id);
    return ok({ reporterCount, confirmed: true });
  } catch (error) {
    return fail(error);
  }
}
