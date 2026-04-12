import { NextRequest } from "next/server";

import { politicalByLocationSchema } from "@/features/political-representatives/shared/validation";
import { AppError } from "@/lib/utils/errors";
import { fail, ok } from "@/lib/utils/http";
import { assertSameOrigin } from "@/lib/utils/request";
import { findRepresentativesByLocation } from "@/features/political-representatives/server/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);

    const body = await request.json().catch(() => {
      throw new AppError("Request body must be valid JSON.", 400);
    });
    const parsed = politicalByLocationSchema.safeParse(body);

    if (!parsed.success) {
      throw new AppError(
        "Latitude and longitude are required.",
        400,
        parsed.error.flatten().fieldErrors,
      );
    }

    const result = await findRepresentativesByLocation(
      parsed.data.latitude,
      parsed.data.longitude,
    );

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
