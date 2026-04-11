import "server-only";

import { MockCivicRepository } from "@/lib/civic/repository.mock";
import type {
  GeoLookupResult,
  OfficialBoundary,
  ReportDetail,
  ReportListItem,
  ReportQueryFilters,
  StatsSummary,
  WasteTypeRecord,
  WardBoundary,
} from "@/lib/civic/types";

export interface CreateReportRecordInput {
  reporterId?: string | null;
  wardId?: string | null;
  wasteTypeId: string;
  landmark: string;
  address: string;
  lat: number;
  lng: number;
  severity: ReportListItem["report"]["severity"];
  photoUrl: string;
}

export interface ResolveReportInput {
  reportId: string;
  verificationPhotoUrl: string;
}

export interface CivicRepository {
  listWards(): Promise<WardBoundary[]>;
  listWasteTypes(): Promise<WasteTypeRecord[]>;
  listReports(filters?: ReportQueryFilters): Promise<ReportListItem[]>;
  getReportDetail(id: string): Promise<ReportDetail | null>;
  lookupByPoint(lat: number, lng: number): Promise<GeoLookupResult>;
  createReport(input: CreateReportRecordInput): Promise<string>;
  incrementReporterCount(id: string): Promise<number>;
  resolveReport(input: ResolveReportInput): Promise<void>;
  getStats(): Promise<StatsSummary>;
  getOfficialContactCards(): Promise<{ mlas: OfficialBoundary[]; mps: OfficialBoundary[] }>;
}

let repository: CivicRepository | null = null;

export function getCivicRepository() {
  if (!repository) {
    repository = new MockCivicRepository();
  }

  return repository;
}
