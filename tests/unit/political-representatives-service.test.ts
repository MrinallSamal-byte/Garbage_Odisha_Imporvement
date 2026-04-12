import { describe, expect, it } from "vitest";

import mappingJson from "@/data/civic/bhubaneswar-political-area-mapping.seed.json";
import type { ReverseGeocoder } from "@/lib/geo/reverse-geocoder";
import type { PoliticalAreaMapping } from "@/lib/political/types";
import { findRepresentativesByLocation } from "@/server/services/political-representatives-service";
import type { ReverseGeocodeResult } from "@/types/domain";

const mapping = mappingJson as PoliticalAreaMapping;

function reverseGeocoder(address: Partial<ReverseGeocodeResult>): ReverseGeocoder {
  return {
    async reverseGeocode() {
      return {
        addressLine: address.addressLine ?? address.formattedLabel ?? "Bhubaneswar, Odisha, India",
        locality: address.locality ?? null,
        suburb: address.suburb ?? null,
        neighbourhood: address.neighbourhood ?? null,
        village: address.village ?? null,
        city: address.city ?? "Bhubaneswar",
        wardName: address.wardName ?? null,
        wardNumber: address.wardNumber ?? null,
        gramPanchayat: address.gramPanchayat ?? null,
        blockName: address.blockName ?? null,
        districtName: address.districtName ?? "Khordha",
        stateName: address.stateName ?? "Odisha",
        countryName: address.countryName ?? "India",
        postalCode: address.postalCode ?? null,
        formattedLabel: address.formattedLabel ?? address.addressLine ?? "Bhubaneswar, Odisha, India",
        source: "test",
      };
    },
  };
}

function dependencies(address: Partial<ReverseGeocodeResult>) {
  return {
    reverseGeocoder: reverseGeocoder(address),
    mappingRepository: {
      async getActiveMapping() {
        return mapping;
      },
    },
    async polygonLookup() {
      return {
        district: null,
        assemblyConstituency: null,
        parliamentConstituency: null,
        mla: null,
        mp: null,
        reviewNotes: [],
      };
    },
  };
}

describe("political representatives service fallback matching", () => {
  it("resolves an exact locality keyword match", async () => {
    const result = await findRepresentativesByLocation(
      20.35,
      85.82,
      dependencies({
        locality: "Patia",
        addressLine: "Patia, Bhubaneswar, Odisha, India",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assembly_constituency.name).toBe("Bhubaneswar North (Uttar)");
      expect(result.data.matched_by).toBe("keyword");
      expect(result.data.mla.name).toBe("Susant Kumar Rout");
    }
  });

  it("prefers ward match before keywords", async () => {
    const result = await findRepresentativesByLocation(
      20.29,
      85.82,
      dependencies({ wardName: "BMC Ward 16" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assembly_constituency.name).toBe("Bhubaneswar Central (Madhya)");
      expect(result.data.matched_by).toBe("ward");
    }
  });

  it("matches gram panchayat names", async () => {
    const result = await findRepresentativesByLocation(
      20.39,
      85.82,
      dependencies({ gramPanchayat: "Kalarahanga" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assembly_constituency.name).toBe("Bhubaneswar North (Uttar)");
      expect(result.data.matched_by).toBe("gp");
    }
  });

  it("returns ambiguous match for unresolved ambiguous locality", async () => {
    const result = await findRepresentativesByLocation(
      20.28,
      85.8,
      dependencies({
        locality: "Nayapalli",
        addressLine: "Nayapalli, Bhubaneswar, Odisha, India",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error_code).toBe("AMBIGUOUS_MATCH");
      expect(result.candidates).toContain("Bhubaneswar Central (Madhya)");
      expect(result.candidates).toContain("Ekamra-Bhubaneswar");
    }
  });

  it("returns no match when no evidence is available", async () => {
    const result = await findRepresentativesByLocation(
      20.1,
      85.1,
      dependencies({ locality: "Moon Base" }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error_code).toBe("NO_MATCH_FOUND");
      expect(result.matched_by).toBe("none");
    }
  });
});
