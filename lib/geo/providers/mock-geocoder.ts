import "server-only";

import localityPoints from "@/data/mock/locality-points.json";
import { haversineDistanceMeters } from "@/lib/utils/geo";
import type { ReverseGeocodeResult } from "@/types/domain";

import type { ReverseGeocoder } from "@/lib/geo/reverse-geocoder";

export class MockReverseGeocoder implements ReverseGeocoder {
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const nearest = localityPoints
      .map((point) => ({
        ...point,
        distanceMeters: haversineDistanceMeters(lat, lng, point.lat, point.lng),
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

    const locality = nearest?.name ?? "Unknown locality";
    const district = nearest?.districtName ?? "Odisha";
    const addressLine = `${locality}, ${district}, Odisha, India`;

    return {
      addressLine,
      locality,
      wardName: null,
      blockName: null,
      districtName: district,
      stateName: "Odisha",
      countryName: "India",
      postalCode: null,
      formattedLabel: `${addressLine} (mock reverse geocoder)`,
      source: "mock",
    };
  }
}
