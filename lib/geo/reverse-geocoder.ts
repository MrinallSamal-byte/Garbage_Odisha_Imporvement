import "server-only";

import { env } from "@/lib/env";
import { MockReverseGeocoder } from "@/lib/geo/providers/mock-geocoder";
import { NominatimReverseGeocoder } from "@/lib/geo/providers/nominatim-geocoder";
import type { ReverseGeocodeResult } from "@/types/domain";

export interface ReverseGeocoder {
  reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult>;
}

let reverseGeocoder: ReverseGeocoder | null = null;

export function getReverseGeocoder() {
  if (!reverseGeocoder) {
    reverseGeocoder =
      env.GEOCODER_PROVIDER === "nominatim" ? new NominatimReverseGeocoder() : new MockReverseGeocoder();
  }

  return reverseGeocoder;
}
