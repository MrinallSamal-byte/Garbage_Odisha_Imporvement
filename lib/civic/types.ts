import type { Feature, MultiPolygon } from "geojson";

import type {
  homeViews,
  reportSeverities,
  reportStatuses,
  wasteTypeKeys,
} from "@/lib/civic/constants";

export type ReportSeverity = (typeof reportSeverities)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type WasteTypeKey = (typeof wasteTypeKeys)[number];
export type HomeView = (typeof homeViews)[number];

export interface WardBoundary {
  id: string;
  number: number;
  name: string;
  zone: string;
  boundaryGeojson: Feature<MultiPolygon>;
}

export interface OfficialBoundary {
  id: string;
  name: string;
  party: string;
  partyAcronym: string;
  partyLogoUrl: string;
  constituencyName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  profileUrl: string | null;
  boundaryGeojson: Feature<MultiPolygon>;
}

export interface WasteTypeRecord {
  id: string;
  key: WasteTypeKey;
  label: string;
  description: string | null;
}

export interface ReportRecord {
  id: string;
  reporterId: string | null;
  wardId: string;
  mlaId: string;
  mpId: string;
  wasteTypeId: string;
  title: string;
  address: string;
  landmark: string | null;
  photoUrl: string;
  verificationPhotoUrl: string | null;
  lat: number;
  lng: number;
  severity: ReportSeverity;
  status: ReportStatus;
  reporterCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface ReportListItem {
  report: ReportRecord;
  ward: WardBoundary;
  mla: OfficialBoundary;
  mp: OfficialBoundary;
  wasteType: WasteTypeRecord;
}

export interface ReportDetail extends ReportListItem {
  daysOpen: number;
}

export interface GeoLookupResult {
  ward: WardBoundary | null;
  mla: OfficialBoundary | null;
  mp: OfficialBoundary | null;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface StatsSummary {
  totalActiveDumps: number;
  severityDistribution: Array<{ severity: ReportSeverity; count: number }>;
  topWards: Array<{ wardId: string; wardLabel: string; count: number }>;
  trend: TrendPoint[];
}

export interface HomeFilters {
  severity: ReportSeverity | "all";
  status: ReportStatus | "all";
  view: HomeView;
  reportId: string | null;
  statsOpen: boolean;
}

export interface ReportQueryFilters {
  severity?: ReportSeverity | "all";
  status?: ReportStatus | "all";
}

export interface SubmitReportPayload {
  wardId?: string | null;
  wasteTypeId: string;
  landmark: string;
  address: string;
  lat: number;
  lng: number;
  severity: ReportSeverity;
  photo: File;
}

export interface ReportMutationResult {
  ok: boolean;
  error?: string;
  reportId?: string;
}
