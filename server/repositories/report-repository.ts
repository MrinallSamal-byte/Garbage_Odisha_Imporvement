import type {
  DashboardStats,
  ModerationStatus,
  PreviewSessionPayload,
  ReportComment,
  ReportDetail,
  ReportFilters,
  ReportListItem,
  ReportStatus,
} from "@/types/domain";

export interface CreateReportFromPreviewInput {
  preview: PreviewSessionPayload;
  description: string;
  anonymousFlag: boolean;
  createdByUserId?: string | null;
  finalStorageKey: string;
}

export interface ReportRepository {
  listPublicReports(filters?: ReportFilters): Promise<ReportListItem[]>;
  getReportDetail(reportId: string): Promise<ReportDetail | null>;
  createReportFromPreview(input: CreateReportFromPreviewInput): Promise<ReportDetail>;
  addComment(reportId: string, displayName: string, body: string, userId?: string | null): Promise<ReportComment>;
  addVote(reportId: string, sessionKey: string, userId?: string | null): Promise<{ count: number; created: boolean }>;
  hasVote(reportId: string, sessionKey: string, userId?: string | null): Promise<boolean>;
  updateStatus(
    reportId: string,
    status: ReportStatus,
    note: string,
    changedByUserId?: string | null,
  ): Promise<ReportDetail>;
  updateModeration(
    reportId: string,
    moderationStatus: ModerationStatus,
    reason: string,
    moderatorId?: string | null,
  ): Promise<ReportDetail>;
  findDuplicateCandidates(input: {
    sha256Hash: string;
    latitude: number;
    longitude: number;
    sessionFingerprintHash?: string | null;
    timeWindowHours?: number;
  }): Promise<{
    sameImageMatches: ReportListItem[];
    nearbyMatches: Array<ReportListItem & { distanceMeters: number }>;
    sessionMatches: ReportListItem[];
  }>;
  getDashboardStats(): Promise<DashboardStats>;
  getRepresentativeReportItems(representativeId: string): Promise<ReportListItem[]>;
  listAdminReports(): Promise<ReportListItem[]>;
}
