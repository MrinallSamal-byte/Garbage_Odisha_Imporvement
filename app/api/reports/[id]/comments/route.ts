import { NextRequest } from "next/server";

import { commentSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/utils/http";
import { assertSameOrigin } from "@/lib/utils/request";
import { getReportRepository } from "@/server/repositories/repository-factory";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    assertSameOrigin(request);
    const { id } = await params;
    const body = commentSchema.parse(await request.json());
    const comment = await getReportRepository().addComment(id, body.displayName, body.body, null);
    return ok({ comment }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
