import { beforeEach, describe, expect, it } from "vitest";

import { resetMockState } from "@/lib/mock/runtime-store";
import { isPointInsideOdisha, lookupRepresentativesByPoint } from "@/server/services/spatial-lookup-service";

describe("spatial lookup service", () => {
  beforeEach(async () => {
    await resetMockState();
  });

  it("confirms a point inside Odisha mock boundary", async () => {
    await expect(isPointInsideOdisha(20.2963, 85.8192)).resolves.toBe(true);
  });

  it("rejects a point outside Odisha mock boundary", async () => {
    await expect(isPointInsideOdisha(24.0, 88.0)).resolves.toBe(false);
  });

  it("maps a point to the correct constituencies and representatives", async () => {
    const result = await lookupRepresentativesByPoint(20.2963, 85.8192);

    expect(result.district?.name).toBe("Khordha");
    expect(result.assemblyConstituency?.name).toBe("Bhubaneswar Central");
    expect(result.parliamentConstituency?.name).toBe("Bhubaneswar");
    expect(result.mla?.name).toBe("Ananta Narayan Jena");
    expect(result.mp?.name).toBe("Aparajita Sarangi");
  });
});
