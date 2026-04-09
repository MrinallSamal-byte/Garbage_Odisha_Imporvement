import { NextRequest } from "next/server";

import { adminLoginSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/utils/http";
import { loginAdmin } from "@/server/services/admin-service";

export async function POST(request: NextRequest) {
  try {
    const body = adminLoginSchema.parse(await request.json());
    const user = await loginAdmin(body.email, body.password);
    return ok({ user });
  } catch (error) {
    return fail(error);
  }
}
