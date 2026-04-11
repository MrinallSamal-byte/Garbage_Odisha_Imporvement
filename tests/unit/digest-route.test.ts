import { beforeEach, describe, expect, it, vi } from "vitest";

const dashboardMocks = vi.hoisted(() => ({
  getDashboardData: vi.fn(),
}));

vi.mock("@/server/services/report-query-service", () => ({
  getDashboardData: dashboardMocks.getDashboardData,
}));

vi.mock("@/server/services/report-presentation-service", () => ({
  serializeReportListItem: (item: unknown) => item,
}));

import { GET } from "@/app/api/digest/route";

const reportItem = {
  report: {
    id: "report-1",
    reportCode: "SOD-1",
    description: "Overflow beside market",
    status: "VERIFIED",
    severity: "HIGH",
    category: "overflow",
    addressLine: "Nayapalli Market Road",
    trustScore: 88,
    createdAt: "2026-04-09T08:10:00.000Z",
  },
  district: { name: "Khordha" },
  assemblyConstituency: { name: "Bhubaneswar Central" },
  parliamentConstituency: { name: "Bhubaneswar" },
  mla: { name: "Ananta Narayan Jena", partyName: "Biju Janata Dal" },
  mp: { name: "Aparajita Sarangi", partyName: "Bharatiya Janata Party" },
  votes: 2,
  comments: 1,
};

const stats = {
  totalReports: 2,
  unresolvedReports: 1,
  resolvedReports: 1,
  highSeverityReports: 1,
};

describe("digest route", () => {
  beforeEach(() => {
    dashboardMocks.getDashboardData.mockResolvedValue({
      reports: [reportItem],
      stats,
    });
  });

  it("returns JSON when format=json is requested", async () => {
    const response = await GET(new Request("http://localhost:3000/api/digest?format=json"));
    const payload = await response.json();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(payload.stats).toEqual(stats);
    expect(payload.items[0]).toMatchObject({
      id: "report-1",
      mla: { name: "Ananta Narayan Jena" },
      mp: { name: "Aparajita Sarangi" },
    });
  });

  it("returns RSS by default", async () => {
    const response = await GET(new Request("http://localhost:3000/api/digest"));
    const body = await response.text();

    expect(response.headers.get("content-type")).toContain("application/rss+xml");
    expect(body).toContain("<rss version=\"2.0\"");
  });
});
