import { AppError } from "@/lib/utils/errors";
import type { ReverseGeocodeResult } from "@/types/domain";

import type { ReverseGeocoder } from "@/lib/geo/reverse-geocoder";

type NominatimResponse = {
  display_name?: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    village?: string;
    road?: string;
    city?: string;
    town?: string;
    municipality?: string;
    city_district?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
};

export class NominatimReverseGeocoder implements ReverseGeocoder {
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "SafaOdisha civic reporting platform",
        },
        next: {
          revalidate: 0,
        },
      },
    );

    if (!response.ok) {
      throw new AppError("Reverse geocoding failed.", 502);
    }

    const payload = (await response.json()) as NominatimResponse;
    const suburb = payload.address?.suburb ?? null;
    const neighbourhood = payload.address?.neighbourhood ?? payload.address?.quarter ?? null;
    const village = payload.address?.village ?? null;
    const city = payload.address?.city ?? payload.address?.town ?? null;
    const locality =
      suburb ??
      neighbourhood ??
      village ??
      payload.address?.town ??
      payload.address?.city ??
      null;

    return {
      addressLine:
        payload.address?.road && locality
          ? `${payload.address.road}, ${locality}, ${payload.address?.county ?? ""}`.replace(/,\s*,/g, ",")
          : payload.display_name ?? "Unknown address",
      locality,
      suburb,
      neighbourhood,
      village,
      city,
      wardName: null,
      wardNumber: null,
      gramPanchayat: village,
      blockName: payload.address?.municipality ?? payload.address?.city_district ?? null,
      districtName: payload.address?.county ?? payload.address?.city_district ?? null,
      stateName: payload.address?.state ?? null,
      countryName: payload.address?.country ?? null,
      postalCode: payload.address?.postcode ?? null,
      formattedLabel: payload.display_name ?? "Unknown address",
      source: "nominatim",
    };
  }
}
