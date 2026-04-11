import { describe, expect, it } from "vitest";

import { toWardOptions } from "@/lib/civic/map-view";
import type { WardBoundary } from "@/lib/civic/types";

const bhubaneswarWards: WardBoundary[] = [
  { id: "ward-30", number: 30, name: "Nayapalli West", zone: "Central", boundaryGeojson: {} as WardBoundary["boundaryGeojson"] },
  { id: "ward-31", number: 31, name: "Nayapalli Market", zone: "Central", boundaryGeojson: {} as WardBoundary["boundaryGeojson"] },
  { id: "ward-32", number: 32, name: "Old Town", zone: "South", boundaryGeojson: {} as WardBoundary["boundaryGeojson"] },
  { id: "ward-33", number: 33, name: "Rasulgarh", zone: "East", boundaryGeojson: {} as WardBoundary["boundaryGeojson"] },
];

describe("Bhubaneswar civic map view helpers", () => {
  it("builds sorted Bhubaneswar ward dropdown options", () => {
    const options = toWardOptions(bhubaneswarWards);

    expect(options.map((option) => option.label)).toEqual([
      "Ward 30 - Nayapalli West",
      "Ward 31 - Nayapalli Market",
      "Ward 32 - Old Town",
      "Ward 33 - Rasulgarh",
    ]);
  });

  it("does not expose non-Bhubaneswar locality names in ward options", () => {
    const labels = toWardOptions(bhubaneswarWards).map((option) => option.label).join(" ");

    expect(labels).not.toMatch(/Delhi|Bengaluru|AECS|Mahadevapura|Doddanahalli|Padmanabha/i);
  });
});
