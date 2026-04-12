/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PoliticalLocationDetector } from "@/features/political-representatives/components/political-location-detector";

function mockGeolocationSuccess() {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: {
            latitude: 20.2963,
            longitude: 85.8192,
            accuracy: 12,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    },
  });
}

function mockGeolocationDenied() {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: "Denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
      },
    },
  });
}

function successPayload() {
  return {
    success: true,
    data: {
      status: "matched",
      latitude: 20.2963,
      longitude: 85.8192,
      detected_location: {
        formatted_address: "Patia, Bhubaneswar, Odisha, India",
        locality: "Patia",
        suburb: null,
        neighbourhood: null,
        ward: null,
        ward_number: null,
        gram_panchayat: null,
        city: "Bhubaneswar",
        district: "Khordha",
        state: "Odisha",
        pincode: "751024",
      },
      assembly_constituency: { number: 113, name: "Bhubaneswar North (Uttar)" },
      lok_sabha_constituency: { name: "Bhubaneswar" },
      mla: { name: "Susant Kumar Rout", party_full: "Biju Janata Dal", party_short: "BJD" },
      mla_party: { full: "Biju Janata Dal", short: "BJD" },
      mp: { name: "Aparajita Sarangi", party_full: "Bharatiya Janata Party", party_short: "BJP" },
      mp_party: { full: "Bharatiya Janata Party", short: "BJP" },
      matched_by: "keyword",
      confidence_score: 0.78,
      notes: ["Matched through normalized locality keyword: patia"],
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PoliticalLocationDetector", () => {
  it("shows geolocation permission denied errors", async () => {
    mockGeolocationDenied();
    render(<PoliticalLocationDetector />);

    await userEvent.click(screen.getByRole("button", { name: /detect my location/i }));

    expect(await screen.findByText(/location permission was denied/i)).toBeTruthy();
  });

  it("renders successful representative lookup details", async () => {
    mockGeolocationSuccess();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(successPayload()), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    render(<PoliticalLocationDetector />);
    await userEvent.click(screen.getByRole("button", { name: /detect my location/i }));

    expect(await screen.findByText("Bhubaneswar North (Uttar)")).toBeTruthy();
    expect(screen.getByText("Susant Kumar Rout (BJD)")).toBeTruthy();
    expect(screen.getByText("Aparajita Sarangi (BJP)")).toBeTruthy();
    expect(screen.getByText(/78% confidence/i)).toBeTruthy();
  });

  it("renders ambiguous lookup states", async () => {
    mockGeolocationSuccess();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            success: false,
            status: "ambiguous",
            error_code: "AMBIGUOUS_MATCH",
            message: "Location could not be mapped confidently to a single assembly constituency.",
            candidates: ["Bhubaneswar Central (Madhya)", "Ekamra-Bhubaneswar"],
            matched_by: "keyword_ambiguous",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    render(<PoliticalLocationDetector />);
    await userEvent.click(screen.getByRole("button", { name: /detect my location/i }));

    expect(await screen.findByText(/could not be mapped confidently/i)).toBeTruthy();
    expect(screen.getByText(/Bhubaneswar Central \(Madhya\), Ekamra-Bhubaneswar/)).toBeTruthy();
  });

  it("renders no-match lookup states", async () => {
    mockGeolocationSuccess();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            success: false,
            status: "not_found",
            error_code: "NO_MATCH_FOUND",
            message: "No matching constituency found for the detected location.",
            matched_by: "none",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    render(<PoliticalLocationDetector />);
    await userEvent.click(screen.getByRole("button", { name: /detect my location/i }));

    expect(await screen.findByText(/no matching constituency found/i)).toBeTruthy();
    expect(screen.getByText(/matched by: none/i)).toBeTruthy();
  });

  it("renders backend failures", async () => {
    mockGeolocationSuccess();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "Reverse geocoding failed." }), {
          status: 502,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    render(<PoliticalLocationDetector />);
    await userEvent.click(screen.getByRole("button", { name: /detect my location/i }));

    expect(await screen.findByText("Reverse geocoding failed.")).toBeTruthy();
  });
});
