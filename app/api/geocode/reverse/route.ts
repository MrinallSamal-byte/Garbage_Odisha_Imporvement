import { NextRequest } from "next/server";

import { getReverseGeocoder } from "@/lib/geo/reverse-geocoder";
import { fail, ok } from "@/lib/utils/http";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const lat = Number(request.nextUrl.searchParams.get("lat"));
    const lng = Number(request.nextUrl.searchParams.get("lng"));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return ok({ error: "lat and lng query parameters are required." }, { status: 400 });
    }

    const result = await getReverseGeocoder().reverseGeocode(lat, lng);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
