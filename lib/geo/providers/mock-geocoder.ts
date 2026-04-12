import type { ReverseGeocodeResult } from "@/types/domain";

import type { ReverseGeocoder } from "@/lib/geo/reverse-geocoder";

type MockArea = {
  latitude: number;
  longitude: number;
  locality: string;
  wardName?: string;
  wardNumber?: number;
  gramPanchayat?: string;
  postalCode: string;
};

const mockAreas: MockArea[] = [
  {
    latitude: 20.2963,
    longitude: 85.8192,
    locality: "Jayadev Vihar",
    wardName: "BMC Ward 26",
    wardNumber: 26,
    postalCode: "751013",
  },
  {
    latitude: 20.3537,
    longitude: 85.8267,
    locality: "Patia",
    wardName: "BMC Ward 3",
    wardNumber: 3,
    postalCode: "751024",
  },
  {
    latitude: 20.375,
    longitude: 85.826,
    locality: "Kalarahanga",
    gramPanchayat: "Kalarahanga",
    postalCode: "751024",
  },
  {
    latitude: 20.244,
    longitude: 85.839,
    locality: "Dhauli",
    gramPanchayat: "Dhauli",
    postalCode: "751002",
  },
];

function getNearestMockArea(lat: number, lng: number) {
  const nearest = mockAreas
    .map((area) => ({
      area,
      distance: Math.hypot(area.latitude - lat, area.longitude - lng),
    }))
    .sort((left, right) => left.distance - right.distance)[0];

  return nearest && nearest.distance <= 0.08 ? nearest.area : null;
}

export class MockReverseGeocoder implements ReverseGeocoder {
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    const area = getNearestMockArea(lat, lng);
    const locality = area?.locality ?? `Approximate Bhubaneswar location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const district = "Khordha";
    const addressLine = `${locality}, Bhubaneswar, Odisha, India`;

    return {
      addressLine,
      locality,
      suburb: null,
      neighbourhood: null,
      village: null,
      city: "Bhubaneswar",
      wardName: area?.wardName ?? null,
      wardNumber: area?.wardNumber ?? null,
      gramPanchayat: area?.gramPanchayat ?? null,
      blockName: null,
      districtName: district,
      stateName: "Odisha",
      countryName: "India",
      postalCode: area?.postalCode ?? null,
      formattedLabel: `${addressLine} (mock reverse geocoder)`,
      source: "mock",
    };
  }
}
