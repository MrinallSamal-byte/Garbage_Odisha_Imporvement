import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const civicMocks = vi.hoisted(() => {
  const incrementReporterCount = vi.fn(async () => 4);

  return {
    incrementReporterCount,
    repository: {
      incrementReporterCount,
    },
  };
});

vi.mock("@/lib/civic/repository", () => ({
  getCivicRepository: () => civicMocks.repository,
}));

import { POST as confirmReport } from "@/app/api/reports/[id]/confirm/route";

describe("Bhubaneswar report confirm API", () => {
  beforeEach(() => {
    civicMocks.incrementReporterCount.mockClear();
  });

  it("increments civic reporter count without using the legacy Delhi repository", async () => {
    const response = await confirmReport(
      new NextRequest("http://localhost:3000/api/reports/report-1/confirm", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "report-1" }) },
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ reporterCount: 4, confirmed: true });
    expect(civicMocks.incrementReporterCount).toHaveBeenCalledWith("report-1");
  });
});
