import type { delhiSeverities, delhiStatuses, delhiViews, delhiWasteTypes } from "@/lib/delhi/constants";

export type DelhiSeverity = (typeof delhiSeverities)[number];
export type DelhiStatus = (typeof delhiStatuses)[number];
export type DelhiWasteType = (typeof delhiWasteTypes)[number];
export type DelhiView = (typeof delhiViews)[number];

export type DelhiFilters = {
  view: DelhiView;
  severity: DelhiSeverity | "all";
  status: DelhiStatus | "all";
  wasteType: DelhiWasteType | "all";
  authority: string;
  ward: string;
  mla: string;
  mp: string;
  q: string;
};

export type CivicAuthorityOption = {
  id: string;
  slug: string;
  name: string;
  type: string;
};

export type DelhiReportCard = {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  addressText: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  severity: DelhiSeverity;
  wasteType: DelhiWasteType;
  status: DelhiStatus;
  photoUrl: string;
  thumbnailUrl: string | null;
  reporterCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  authority: {
    id: string | null;
    slug: string | null;
    name: string | null;
    type: string | null;
  };
  ward: {
    id: string | null;
    number: string | null;
    name: string | null;
    zone: string | null;
  };
  assembly: {
    id: string | null;
    name: string | null;
    code: string | null;
  };
  parliament: {
    id: string | null;
    name: string | null;
    code: string | null;
  };
  mla: LeaderSummary | null;
  mp: LeaderSummary | null;
};

export type LeaderSummary = {
  id: string;
  name: string;
  partyName: string | null;
  partyShortName: string | null;
  partyLogoUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  officialUrl: string | null;
};

export type DelhiStats = {
  totalReports: number;
  activeReports: number;
  resolvedReports: number;
  criticalReports: number;
  severityDistribution: Array<{ severity: DelhiSeverity; count: number }>;
  statusDistribution: Array<{ status: DelhiStatus; count: number }>;
  topWards: Array<{ wardId: string; wardLabel: string; count: number }>;
};

export type DelhiHomeData = {
  reports: DelhiReportCard[];
  stats: DelhiStats;
  authorities: CivicAuthorityOption[];
  warnings: string[];
};

export type DelhiJurisdictionLookup = {
  authority: CivicAuthorityOption | null;
  ward: DelhiReportCard["ward"] | null;
  assembly: DelhiReportCard["assembly"] | null;
  parliament: DelhiReportCard["parliament"] | null;
  mla: LeaderSummary | null;
  mp: LeaderSummary | null;
  warnings: string[];
};
