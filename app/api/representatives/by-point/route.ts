import { NextRequest } from "next/server";

import { byPointSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/utils/http";
import { isPointInsideOdisha, lookupRepresentativesByPoint } from "@/server/services/spatial-lookup-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const parsed = byPointSchema.parse({
      lat: request.nextUrl.searchParams.get("lat"),
      lng: request.nextUrl.searchParams.get("lng"),
    });

    const insideOdisha = await isPointInsideOdisha(parsed.lat, parsed.lng);

    if (!insideOdisha) {
      return ok({
        insideOdisha: false,
        lookup: null,
      });
    }

    const lookup = await lookupRepresentativesByPoint(parsed.lat, parsed.lng);
    return ok({
      insideOdisha: true,
      ...lookup,
    });
  } catch (error) {
    return fail(error);
  }
}
