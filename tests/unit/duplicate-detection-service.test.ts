import { beforeEach, describe, expect, it } from "vitest";

import { resetMockState } from "@/lib/mock/runtime-store";
import { detectDuplicateReports } from "@/server/services/duplicate-detection-service";

describe("duplicate detection", () => {
  beforeEach(async () => {
    await resetMockState();
  });

  it("finds same image and nearby report matches for seeded data", async () => {
    const result = await detectDuplicateReports({
      sha256Hash: "seed-hash-1",
      latitude: 20.2963,
      longitude: 85.8192,
      sessionFingerprintHash: "mock-session-1",
    });

    expect(result.sameImageMatches.length).toBeGreaterThan(0);
    expect(result.nearbyMatches.length).toBeGreaterThan(0);
    expect(result.suspicious).toBe(true);
  });
});
