import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { resetMockState } from "@/lib/mock/runtime-store";
import { POST as lookupByLocation } from "@/app/api/political-representatives/by-location/route";

describe("political representatives by-location API", () => {
  beforeEach(async () => {
    await resetMockState();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns representative details for valid Bhubaneswar coordinates", async () => {
    const response = await lookupByLocation(
      new NextRequest("http://localhost:3000/api/political-representatives/by-location", {
        method: "POST",
        body: JSON.stringify({ latitude: 20.2963, longitude: 85.8192 }),
        headers: { "content-type": "application/json" },
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.assembly_constituency.name).toBe("Bhubaneswar Central (Madhya)");
    expect(payload.data.mla.name).toBe("Ananta Narayan Jena");
    expect(payload.data.mp.name).toBe("Aparajita Sarangi");
    expect(payload.data.confidence_score).toBeGreaterThanOrEqual(0.9);
  });

  it("returns validation errors for invalid coordinates", async () => {
    const response = await lookupByLocation(
      new NextRequest("http://localhost:3000/api/political-representatives/by-location", {
        method: "POST",
        body: JSON.stringify({ latitude: "nope", longitude: 85.8192 }),
        headers: { "content-type": "application/json" },
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Latitude and longitude are required.");
  });

  it("includes debug metadata outside production", async () => {
    const response = await lookupByLocation(
      new NextRequest("http://localhost:3000/api/political-representatives/by-location", {
        method: "POST",
        body: JSON.stringify({ latitude: 20.2963, longitude: 85.8192 }),
        headers: { "content-type": "application/json" },
      }),
    );

    const payload = await response.json();

    expect(payload.debug).toBeTruthy();
    expect(payload.debug.normalized_candidates).toEqual(expect.any(Array));
    expect(payload.debug.polygon_lookup_notes).toEqual(expect.any(Array));
  });

  it("omits debug metadata in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await lookupByLocation(
      new NextRequest("http://localhost:3000/api/political-representatives/by-location", {
        method: "POST",
        body: JSON.stringify({ latitude: 20.2963, longitude: 85.8192 }),
        headers: { "content-type": "application/json" },
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.debug).toBeUndefined();
  });
});
