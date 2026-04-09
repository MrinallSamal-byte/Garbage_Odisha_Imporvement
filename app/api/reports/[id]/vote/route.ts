import { NextRequest } from "next/server";

import { voteSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/utils/http";
import { getReportRepository } from "@/server/repositories/repository-factory";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = voteSchema.parse(await request.json());
    const result = await getReportRepository().addVote(id, body.sessionKey, null);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
