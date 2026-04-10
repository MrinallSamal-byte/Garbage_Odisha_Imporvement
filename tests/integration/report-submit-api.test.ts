import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { resetMockState } from "@/lib/mock/runtime-store";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { POST as analyzePost } from "@/app/api/reports/analyze/route";
import { POST as submitPost } from "@/app/api/reports/submit/route";

describe("report analyze and submit API", () => {
  beforeEach(async () => {
    await resetMockState();
  });

  it("analyzes and submits a new live capture report", async () => {
    const imageBuffer = await sharp({
      create: {
        width: 1200,
        height: 900,
        channels: 3,
        background: { r: 183, g: 168, b: 122 },
      },
    })
      .jpeg()
      .toBuffer();

    const formData = new FormData();
    formData.append("image", new File([imageBuffer], "capture.jpg", { type: "image/jpeg" }));
    formData.append("latitude", "20.2963");
    formData.append("longitude", "85.8192");
    formData.append("gpsAccuracyMeters", "11");
    formData.append("captureTimestamp", new Date().toISOString());
    formData.append("description", "Overflowing roadside garbage near Nayapalli market.");
    formData.append("sourceType", "LIVE_CAPTURE");

    const analyzeResponse = await analyzePost(
      new NextRequest("http://localhost:3000/api/reports/analyze", {
        method: "POST",
        body: formData,
      }),
    );

    const analyzePayload = await analyzeResponse.json();
    expect(analyzeResponse.status).toBe(200);
    expect(analyzePayload.previewToken).toBeTruthy();

    const submitResponse = await submitPost(
      new NextRequest("http://localhost:3000/api/reports/submit", {
        method: "POST",
        body: JSON.stringify({
          previewToken: analyzePayload.previewToken,
          description: "Overflowing roadside garbage near Nayapalli market.",
          anonymousFlag: true,
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const submitPayload = await submitResponse.json();
    expect(submitResponse.status).toBe(200);
    expect(submitPayload.report.report.reportCode).toMatch(/^SOD-/);

    const detail = await getReportRepository().getReportDetail(submitPayload.report.report.id);
    expect(detail?.timeline[0]?.newStatus).toBe("REPORTED");
  });

  it("submits successfully even when the final description is left blank", async () => {
    const imageBuffer = await sharp({
      create: {
        width: 1200,
        height: 900,
        channels: 3,
        background: { r: 183, g: 168, b: 122 },
      },
    })
      .jpeg()
      .toBuffer();

    const formData = new FormData();
    formData.append("image", new File([imageBuffer], "capture.jpg", { type: "image/jpeg" }));
    formData.append("latitude", "20.2963");
    formData.append("longitude", "85.8192");
    formData.append("gpsAccuracyMeters", "11");
    formData.append("captureTimestamp", new Date().toISOString());
    formData.append("description", "");
    formData.append("sourceType", "LIVE_CAPTURE");

    const analyzeResponse = await analyzePost(
      new NextRequest("http://localhost:3000/api/reports/analyze", {
        method: "POST",
        body: formData,
      }),
    );

    const analyzePayload = await analyzeResponse.json();
    expect(analyzeResponse.status).toBe(200);

    const submitResponse = await submitPost(
      new NextRequest("http://localhost:3000/api/reports/submit", {
        method: "POST",
        body: JSON.stringify({
          previewToken: analyzePayload.previewToken,
          description: "",
          anonymousFlag: true,
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const submitPayload = await submitResponse.json();
    expect(submitResponse.status).toBe(200);
    expect(submitPayload.report.report.description).toMatch(/reported .* issue near/i);
  });
});
