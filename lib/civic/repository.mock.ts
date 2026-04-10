import { booleanPointInPolygon, point } from "@turf/turf";

import { getDaysOpen } from "@/lib/civic/helpers";
import {
  getMockWasteTypeById,
  mockMlas,
  mockMps,
  mockReports,
  mockWasteTypes,
  mockWards,
} from "@/lib/civic/mock-data";
import type {
  GeoLookupResult,
  OfficialBoundary,
  ReportListItem,
  ReportQueryFilters,
  StatsSummary,
} from "@/lib/civic/types";
import { buildReportTitle } from "@/lib/civic/helpers";
import type { CivicRepository, CreateReportRecordInput, ResolveReportInput } from "@/lib/civic/repository";

function findContainingBoundary<T extends { boundaryGeojson: unknown }>(
  items: T[],
  lat: number,
  lng: number,
) {
  return items.find((item) =>
    booleanPointInPolygon(point([lng, lat]), item.boundaryGeojson as never),
  ) ?? null;
}

function joinReport(id: string): ReportListItem | null {
  const report = mockReports.find((item) => item.id === id);
  if (!report) {
    return null;
  }

  const ward = mockWards.find((item) => item.id === report.wardId);
  const mla = mockMlas.find((item) => item.id === report.mlaId);
  const mp = mockMps.find((item) => item.id === report.mpId);
  const wasteType = getMockWasteTypeById(report.wasteTypeId);

  if (!ward || !mla || !mp || !wasteType) {
    return null;
  }

  return {
    report,
    ward,
    mla,
    mp,
    wasteType,
  };
}

export class MockCivicRepository implements CivicRepository {
  async listWards() {
    return [...mockWards].sort((left, right) => left.number - right.number);
  }

  async listWasteTypes() {
    return mockWasteTypes;
  }

  async listReports(filters?: ReportQueryFilters) {
    return mockReports
      .filter((report) => (filters?.severity && filters.severity !== "all" ? report.severity === filters.severity : true))
      .filter((report) => (filters?.status && filters.status !== "all" ? report.status === filters.status : true))
      .map((report) => joinReport(report.id))
      .filter((item): item is ReportListItem => Boolean(item))
      .sort((left, right) => right.report.createdAt.localeCompare(left.report.createdAt));
  }

  async getReportDetail(id: string) {
    const item = joinReport(id);
    if (!item) {
      return null;
    }

    return {
      ...item,
      daysOpen: getDaysOpen(item.report.createdAt, item.report.resolvedAt),
    };
  }

  async lookupByPoint(lat: number, lng: number): Promise<GeoLookupResult> {
    const ward = findContainingBoundary(mockWards, lat, lng);
    const mla = findContainingBoundary(mockMlas, lat, lng);
    const mp = findContainingBoundary(mockMps, lat, lng);
    return { ward, mla, mp };
  }

  async createReport(input: CreateReportRecordInput) {
    const lookup = await this.lookupByPoint(input.lat, input.lng);
    const ward = input.wardId
      ? mockWards.find((item) => item.id === input.wardId) ?? lookup.ward
      : lookup.ward;
    const mla = lookup.mla ?? (ward?.number === 33 ? mockMlas[1] : mockMlas[0]);
    const mp = lookup.mp ?? mockMps[0];

    if (!ward || !mla || !mp) {
      throw new Error("Could not match the report location to a ward, MLA, and MP.");
    }

    const id = crypto.randomUUID();
    mockReports.unshift({
      id,
      reporterId: input.reporterId ?? null,
      wardId: ward.id,
      mlaId: mla.id,
      mpId: mp.id,
      wasteTypeId: input.wasteTypeId,
      title: buildReportTitle(input.landmark, ward.number),
      address: input.address,
      landmark: input.landmark,
      photoUrl: input.photoUrl,
      verificationPhotoUrl: null,
      lat: input.lat,
      lng: input.lng,
      severity: input.severity,
      status: "unresolved",
      reporterCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    });

    return id;
  }

  async incrementReporterCount(id: string) {
    const report = mockReports.find((item) => item.id === id);
    if (!report) {
      throw new Error("Report not found.");
    }

    report.reporterCount += 1;
    report.updatedAt = new Date().toISOString();
    return report.reporterCount;
  }

  async resolveReport(input: ResolveReportInput) {
    const report = mockReports.find((item) => item.id === input.reportId);
    if (!report) {
      throw new Error("Report not found.");
    }

    report.status = "resolved";
    report.verificationPhotoUrl = input.verificationPhotoUrl;
    report.resolvedAt = new Date().toISOString();
    report.updatedAt = report.resolvedAt;
  }

  async getStats(): Promise<StatsSummary> {
    const activeReports = mockReports.filter((report) => report.status !== "resolved");
    const topWards = mockWards
      .map((ward) => ({
        wardId: ward.id,
        wardLabel: `Ward #${ward.number} · ${ward.name}`,
        count: activeReports.filter((report) => report.wardId === ward.id).length,
      }))
      .filter((item) => item.count > 0)
      .sort((left, right) => right.count - left.count)
      .slice(0, 3);

    const severityDistribution = ["minor", "moderate", "severe", "critical"].map((severity) => ({
      severity: severity as ReportListItem["report"]["severity"],
      count: activeReports.filter((report) => report.severity === severity).length,
    }));

    const trendMap = new Map<string, number>();
    for (const report of mockReports) {
      const key = report.createdAt.slice(0, 10);
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }

    return {
      totalActiveDumps: activeReports.length,
      severityDistribution,
      topWards,
      trend: Array.from(trendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((left, right) => left.date.localeCompare(right.date)),
    };
  }

  async getOfficialContactCards(): Promise<{ mlas: OfficialBoundary[]; mps: OfficialBoundary[] }> {
    return { mlas: mockMlas, mps: mockMps };
  }
}
