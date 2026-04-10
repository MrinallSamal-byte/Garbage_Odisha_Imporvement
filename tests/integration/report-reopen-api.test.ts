import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST as reopenPost } from "@/app/api/reports/[id]/reopen/route";
import { resetMockState } from "@/lib/mock/runtime-store";
import { getReportRepository } from "@/server/repositories/repository-factory";

describe("report reopen API", () => {
  beforeEach(async () => {
    await resetMockState();
  });

  it("reopens a resolved report when the same session has already supported it", async () => {
    const response = await reopenPost(
      new NextRequest("http://localhost:3000/api/reports/66666666-6666-4666-8666-222222222222/reopen", {
        method: "POST",
        body: JSON.stringify({
          sessionKey: "support-session-3",
          reason: "The garbage is still visible and the area has not been cleaned.",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "66666666-6666-4666-8666-222222222222" }) },
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.report.report.status).toBe("REPORTED");
  });

  it("blocks reopen requests from sessions that never supported the complaint", async () => {
    const response = await reopenPost(
      new NextRequest("http://localhost:3000/api/reports/66666666-6666-4666-8666-222222222222/reopen", {
        method: "POST",
        body: JSON.stringify({
          sessionKey: "unknown-session",
          reason: "The garbage is still visible and the area has not been cleaned.",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "66666666-6666-4666-8666-222222222222" }) },
    );

    const payload = await response.json();
    expect(response.status).toBe(403);
    expect(payload.error).toMatch(/support this complaint/i);

    const detail = await getReportRepository().getReportDetail("66666666-6666-4666-8666-222222222222");
    expect(detail?.report.status).toBe("RESOLVED");
  });
});
