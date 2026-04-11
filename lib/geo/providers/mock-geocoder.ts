import type { ReverseGeocodeResult } from "@/types/domain";

import type { ReverseGeocoder } from "@/lib/geo/reverse-geocoder";

export class MockReverseGeocoder implements ReverseGeocoder {
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const locality = `Approximate Bhubaneswar location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const district = "Khordha";
    const addressLine = `${locality}, Bhubaneswar, Odisha, India`;

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
