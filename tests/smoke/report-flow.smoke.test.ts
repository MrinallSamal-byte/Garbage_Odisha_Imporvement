import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { resetMockState } from "@/lib/mock/runtime-store";
import { POST as analyzePost } from "@/app/api/reports/analyze/route";
import { POST as submitPost } from "@/app/api/reports/submit/route";

describe("mock mode report flow smoke", () => {
  beforeEach(async () => {
    await resetMockState();
  });

  it("seeds mock data and completes analyze plus submit", async () => {
    const imageBuffer = await sharp({
      create: {
        width: 640,
        height: 480,
        channels: 3,
        background: { r: 153, g: 140, b: 114 },
      },
    })
      .png()
      .toBuffer();

    const analyzeFormData = new FormData();
    analyzeFormData.append("image", new File([imageBuffer], "smoke.png", { type: "image/png" }));
    analyzeFormData.append("latitude", "20.1591");
    analyzeFormData.append("longitude", "85.7076");
    analyzeFormData.append("gpsAccuracyMeters", "9");
    analyzeFormData.append("captureTimestamp", new Date().toISOString());
    analyzeFormData.append("description", "Garbage pile near Jatni bus stand.");
    analyzeFormData.append("sourceType", "LIVE_CAPTURE");

    const analyzeResponse = await analyzePost(
      new NextRequest("http://localhost:3000/api/reports/analyze", {
        method: "POST",
        body: analyzeFormData,
      }),
    );

    const analyzePayload = await analyzeResponse.json();
    expect(analyzePayload.previewToken).toBeTruthy();
    expect(analyzePayload.assemblyConstituency.name).toBe("Jatni");
    expect(analyzePayload.mla.name).toBe("Ritwick Sahoo");

    const submitResponse = await submitPost(
      new NextRequest("http://localhost:3000/api/reports/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          previewToken: analyzePayload.previewToken,
          description: "Garbage pile near Jatni bus stand.",
          anonymousFlag: false,
        }),
      }),
    );

    const submitPayload = await submitResponse.json();
    expect(submitResponse.status).toBe(200);
    expect(submitPayload.report.report.status).toBe("REPORTED");
    expect(submitPayload.report.report.assemblyConstituencyId).toBe("33330000-0000-4000-8000-222222222222");
  });
});
