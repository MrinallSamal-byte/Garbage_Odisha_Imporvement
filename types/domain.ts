import type { Feature, MultiPolygon, Point } from "geojson";

export const sourceTypes = ["LIVE_CAPTURE", "GALLERY_UPLOAD", "MANUAL_PIN_ONLY"] as const;
export const reportCategories = [
  "garbage",
  "overflow",
  "drain",
  "roadside_dump",
  "mixed_waste",
  "litter",
  "other",
] as const;
export const reportSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const reportStatuses = [
  "REPORTED",
  "VERIFIED",
  "FORWARDED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "DUPLICATE",
] as const;
export const moderationStatuses = ["PENDING", "APPROVED", "REJECTED", "NEEDS_REVIEW"] as const;
export const userRoles = ["CITIZEN", "ADMIN", "MODERATOR"] as const;
export const representativeTypes = ["MLA", "MP"] as const;
export const constituencyTypes = ["ASSEMBLY", "PARLIAMENT"] as const;
export const aiIssueTypes = [
  "garbage",
  "overflow",
  "drain",
  "roadside_dump",
  "mixed_waste",
  "litter",
  "other",
] as const;
export const aiEnvironmentTypes = [
  "residential",
  "roadside",
  "market",
  "institution",
  "public_space",
  "rural",
  "unknown",
] as const;
export const aiLanguages = ["odia", "english", "mixed", "unknown"] as const;
export const aiGarbageSeverities = ["low", "medium", "high"] as const;
export const aiGpsConsistencyLevels = ["high", "medium", "low"] as const;

export type SourceType = (typeof sourceTypes)[number];
export type ReportCategory = (typeof reportCategories)[number];
export type ReportSeverity = (typeof reportSeverities)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type ModerationStatus = (typeof moderationStatuses)[number];
export type UserRole = (typeof userRoles)[number];
export type RepresentativeType = (typeof representativeTypes)[number];
export type ConstituencyType = (typeof constituencyTypes)[number];
export type AiIssueType = (typeof aiIssueTypes)[number];
export type AiEnvironmentType = (typeof aiEnvironmentTypes)[number];
export type AiLanguage = (typeof aiLanguages)[number];
export type AiGarbageSeverity = (typeof aiGarbageSeverities)[number];
export type AiGpsConsistencyLevel = (typeof aiGpsConsistencyLevels)[number];

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  passwordHash?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Party {
  id: string;
  name: string;
  abbreviation: string;
  levelScope: "STATE" | "NATIONAL" | "BOTH";
  isStateRulingPartyDefault: boolean;
  isCentralRulingPartyDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: string;
  name: string;
  code: string;
  geometry: Feature<MultiPolygon> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConstituencyRecord {
  id: string;
  code: string;
  name: string;
  districtName: string | null;
  geometry: Feature<MultiPolygon>;
  metadataJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Representative {
  id: string;
  representativeType: RepresentativeType;
  name: string;
  constituencyType: ConstituencyType;
  assemblyConstituencyId: string | null;
  parliamentConstituencyId: string | null;
  partyName: string;
  isStateRulingParty: boolean;
  isCentralRulingParty: boolean;
  oppositionLabel: string | null;
  photoUrl: string | null;
  officialRoleTitle: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  socialLinksJson: Record<string, string> | null;
  termStart: string | null;
  termEnd: string | null;
  active: boolean;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  reportId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  sha256Hash: string;
  exifJson: Record<string, unknown> | null;
  capturedAt: string | null;
  uploadedAt: string;
  previewUrl?: string | null;
}

export interface ReportAiSummary {
  issueDetected: boolean;
  issueType: AiIssueType;
  confidenceScore: number;
  visibleLandmarks: string[];
  detectedText: string[];
  languageDetected: AiLanguage;
  likelyEnvironment: AiEnvironmentType;
  garbageSeverity: AiGarbageSeverity;
  gpsImageConsistency: AiGpsConsistencyLevel;
  suspiciousFlag: boolean;
  moderationNotes: string;
  localityClues: string[];
}

export interface Report {
  id: string;
  reportCode: string;
  sourceType: SourceType;
  description: string;
  category: ReportCategory;
  severity: ReportSeverity;
  status: ReportStatus;
  moderationStatus: ModerationStatus;
  trustScore: number;
  gpsAccuracyMeters: number;
  latitude: number;
  longitude: number;
  locationPoint: Feature<Point>;
  addressLine: string;
  locality: string | null;
  wardName: string | null;
  blockName: string | null;
  districtId: string | null;
  assemblyConstituencyId: string | null;
  parliamentConstituencyId: string | null;
  mlaRepresentativeId: string | null;
  mpRepresentativeId: string | null;
  aiIssueDetected: boolean;
  aiIssueType: AiIssueType;
  aiConfidenceScore: number;
  aiGpsImageConsistency: AiGpsConsistencyLevel;
  aiSuspiciousFlag: boolean;
  aiSummaryJson: ReportAiSummary;
  anonymousFlag: boolean;
  createdByUserId: string | null;
  deviceFingerprintHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportStatusHistory {
  id: string;
  reportId: string;
  oldStatus: ReportStatus | null;
  newStatus: ReportStatus;
  note: string;
  changedByUserId: string | null;
  createdAt: string;
}

export interface ReportComment {
  id: string;
  reportId: string;
  userId: string | null;
  displayName: string;
  body: string;
  moderationStatus: ModerationStatus;
  createdAt: string;
}

export interface ReportVote {
  id: string;
  reportId: string;
  userId: string | null;
  sessionKey: string | null;
  createdAt: string;
}

export interface ModerationLog {
  id: string;
  reportId: string;
  moderatorId: string | null;
  actionType: string;
  reason: string;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface OdishaBoundaryRecord {
  id: string;
  name: string;
  geometry: Feature<MultiPolygon>;
}

export interface ReverseGeocodeResult {
  addressLine: string;
  locality: string | null;
  wardName: string | null;
  blockName: string | null;
  districtName: string | null;
  stateName: string | null;
  countryName: string | null;
  postalCode: string | null;
  formattedLabel: string;
  source: string;
}

export interface DuplicateDetectionResult {
  suspicious: boolean;
  sameImageMatches: Array<{ reportId: string; reportCode: string; createdAt: string }>;
  nearbyMatches: Array<{ reportId: string; reportCode: string; distanceMeters: number }>;
  sessionMatches: Array<{ reportId: string; reportCode: string; createdAt: string }>;
  notes: string[];
}

export interface ConstituencyLookupResult {
  district: District | null;
  assemblyConstituency: ConstituencyRecord | null;
  parliamentConstituency: ConstituencyRecord | null;
  mla: Representative | null;
  mp: Representative | null;
  reviewNotes: string[];
}

export interface AnalyzeReportInput {
  imageBase64: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  latitude: number;
  longitude: number;
  gpsAccuracyMeters: number;
  captureTimestamp: string;
  description?: string;
  sourceType: SourceType;
  sessionFingerprintHash?: string | null;
}

export interface AnalyzeReportResult {
  previewToken: string;
  address: ReverseGeocodeResult;
  insideOdisha: boolean;
  district: District | null;
  assemblyConstituency: ConstituencyRecord | null;
  parliamentConstituency: ConstituencyRecord | null;
  mla: Representative | null;
  mp: Representative | null;
  aiSummary: ReportAiSummary;
  trustScore: number;
  duplicateDetection: DuplicateDetectionResult;
  reviewNotes: string[];
  mediaPreviewUrl: string | null;
}

export interface SubmitReportInput {
  previewToken: string;
  description: string;
  anonymousFlag: boolean;
  userId?: string | null;
}

export interface ReportFilters {
  district?: string;
  constituency?: string;
  category?: ReportCategory;
  status?: ReportStatus;
  severity?: ReportSeverity;
  sourceType?: SourceType;
  startDate?: string;
  endDate?: string;
}

export interface ReportListItem {
  report: Report;
  district: District | null;
  assemblyConstituency: ConstituencyRecord | null;
  parliamentConstituency: ConstituencyRecord | null;
  mla: Representative | null;
  mp: Representative | null;
  media: MediaAsset[];
  votes: number;
  comments: number;
}

export interface ReportDetail extends ReportListItem {
  timeline: ReportStatusHistory[];
  commentItems: ReportComment[];
}

export interface DashboardStats {
  totalReports: number;
  unresolvedReports: number;
  resolvedReports: number;
  averageTrustScore: number;
  highSeverityReports: number;
}

export interface PreviewSessionPayload {
  id: string;
  createdAt: string;
  expiresAt: string;
  input: AnalyzeReportInput;
  address: ReverseGeocodeResult;
  lookup: ConstituencyLookupResult;
  aiSummary: ReportAiSummary;
  duplicateDetection: DuplicateDetectionResult;
  trustScore: number;
  media: {
    tempStorageKey: string;
    sha256Hash: string;
    width: number | null;
    height: number | null;
    exifJson: Record<string, unknown> | null;
  };
  reviewNotes: string[];
}

export interface MockDatabaseState {
  users: User[];
  parties: Party[];
  districts: District[];
  assemblyConstituencies: ConstituencyRecord[];
  parliamentConstituencies: ConstituencyRecord[];
  representatives: Representative[];
  reports: Report[];
  mediaAssets: MediaAsset[];
  reportStatusHistory: ReportStatusHistory[];
  reportComments: ReportComment[];
  reportVotes: ReportVote[];
  moderationLogs: ModerationLog[];
  odishaBoundary: OdishaBoundaryRecord[];
}
