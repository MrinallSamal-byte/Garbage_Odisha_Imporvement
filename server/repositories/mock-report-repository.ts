import { randomUUID } from "crypto";

import type {
  DashboardStats,
  ModerationStatus,
  PreviewSessionPayload,
  Report,
  ReportComment,
  ReportDetail,
  ReportFilters,
  ReportListItem,
  ReportSeverity,
  ReportStatus,
} from "@/types/domain";
import { readMockState, writeMockState } from "@/lib/mock/runtime-store";
import { haversineDistanceMeters } from "@/lib/utils/geo";
import { AppError } from "@/lib/utils/errors";

import type { CreateReportFromPreviewInput, ReportRepository } from "./report-repository";

function mapAiSeverityToReportSeverity(value: PreviewSessionPayload["aiSummary"]["garbageSeverity"]): ReportSeverity {
  switch (value) {
    case "high":
      return "HIGH";
    case "medium":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

function matchesFilters(item: ReportListItem, filters?: ReportFilters) {
  if (!filters) {
    return true;
  }

  if (filters.district && item.district?.name !== filters.district) {
    return false;
  }

  if (
    filters.constituency &&
    item.assemblyConstituency?.name !== filters.constituency &&
    item.parliamentConstituency?.name !== filters.constituency
  ) {
    return false;
  }

  if (filters.category && item.report.category !== filters.category) {
    return false;
  }

  if (filters.status && item.report.status !== filters.status) {
    return false;
  }

  if (filters.severity && item.report.severity !== filters.severity) {
    return false;
  }

  if (filters.sourceType && item.report.sourceType !== filters.sourceType) {
    return false;
  }

  if (filters.startDate && Date.parse(item.report.createdAt) < Date.parse(filters.startDate)) {
    return false;
  }

  if (filters.endDate && Date.parse(item.report.createdAt) > Date.parse(filters.endDate)) {
    return false;
  }

  return true;
}

export class MockReportRepository implements ReportRepository {
  private async buildReportListItems() {
    const state = await readMockState();

    const items = state.reports.map<ReportListItem>((report) => {
      const media = state.mediaAssets.filter((asset) => asset.reportId === report.id);
      const district = state.districts.find((item) => item.id === report.districtId) ?? null;
      const assemblyConstituency =
        state.assemblyConstituencies.find((item) => item.id === report.assemblyConstituencyId) ?? null;
      const parliamentConstituency =
        state.parliamentConstituencies.find((item) => item.id === report.parliamentConstituencyId) ?? null;
      const mla = state.representatives.find((item) => item.id === report.mlaRepresentativeId) ?? null;
      const mp = state.representatives.find((item) => item.id === report.mpRepresentativeId) ?? null;
      const votes = state.reportVotes.filter((vote) => vote.reportId === report.id).length;
      const comments = state.reportComments.filter((comment) => comment.reportId === report.id).length;

      return {
        report,
        district,
        assemblyConstituency,
        parliamentConstituency,
        mla,
        mp,
        media,
        votes,
        comments,
      };
    });

    return { state, items };
  }

  private async getReportOrThrow(reportId: string) {
    const state = await readMockState();
    const report = state.reports.find((item) => item.id === reportId);

    if (!report) {
      throw new AppError("Report not found.", 404);
    }

    return { state, report };
  }

  async listPublicReports(filters?: ReportFilters) {
    const { items } = await this.buildReportListItems();
    return items
      .filter((item) => item.report.moderationStatus !== "REJECTED")
      .filter((item) => matchesFilters(item, filters))
      .sort((a, b) => Date.parse(b.report.createdAt) - Date.parse(a.report.createdAt));
  }

  async listAdminReports() {
    const { items } = await this.buildReportListItems();
    return items.sort((a, b) => Date.parse(b.report.createdAt) - Date.parse(a.report.createdAt));
  }

  async getReportDetail(reportId: string) {
    const { state, items } = await this.buildReportListItems();
    const item = items.find((entry) => entry.report.id === reportId);

    if (!item) {
      return null;
    }

    return {
      ...item,
      timeline: state.reportStatusHistory
        .filter((entry) => entry.reportId === reportId)
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
      commentItems: state.reportComments
        .filter((entry) => entry.reportId === reportId)
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    };
  }

  async createReportFromPreview(input: CreateReportFromPreviewInput) {
    const state = await readMockState();
    const now = new Date().toISOString();
    const reportSequence = String(state.reports.length + 1).padStart(3, "0");
    const reportCode = `SOD-${now.slice(0, 10).replace(/-/g, "")}-${reportSequence}`;
    const reportId = randomUUID();
    const moderationStatus =
      input.preview.aiSummary.suspiciousFlag || input.preview.duplicateDetection.suspicious
        ? "NEEDS_REVIEW"
        : "PENDING";

    const report: Report = {
      id: reportId,
      reportCode,
      sourceType: input.preview.input.sourceType,
      description: input.description,
      category: input.preview.aiSummary.issueType,
      severity: mapAiSeverityToReportSeverity(input.preview.aiSummary.garbageSeverity),
      status: "REPORTED",
      moderationStatus,
      trustScore: input.preview.trustScore,
      gpsAccuracyMeters: input.preview.input.gpsAccuracyMeters,
      latitude: input.preview.input.latitude,
      longitude: input.preview.input.longitude,
      locationPoint: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [input.preview.input.longitude, input.preview.input.latitude],
        },
      },
      addressLine: input.preview.address.addressLine,
      locality: input.preview.address.locality,
      wardName: input.preview.address.wardName,
      blockName: input.preview.address.blockName,
      districtId: input.preview.lookup.district?.id ?? null,
      assemblyConstituencyId: input.preview.lookup.assemblyConstituency?.id ?? null,
      parliamentConstituencyId: input.preview.lookup.parliamentConstituency?.id ?? null,
      mlaRepresentativeId: input.preview.lookup.mla?.id ?? null,
      mpRepresentativeId: input.preview.lookup.mp?.id ?? null,
      aiIssueDetected: input.preview.aiSummary.issueDetected,
      aiIssueType: input.preview.aiSummary.issueType,
      aiConfidenceScore: input.preview.aiSummary.confidenceScore,
      aiGpsImageConsistency: input.preview.aiSummary.gpsImageConsistency,
      aiSuspiciousFlag: input.preview.aiSummary.suspiciousFlag,
      aiSummaryJson: input.preview.aiSummary,
      anonymousFlag: input.anonymousFlag,
      createdByUserId: input.createdByUserId ?? null,
      deviceFingerprintHash: input.preview.input.sessionFingerprintHash ?? null,
      createdAt: now,
      updatedAt: now,
    };

    state.reports.push(report);
    state.mediaAssets.push({
      id: randomUUID(),
      reportId,
      storageKey: input.finalStorageKey,
      originalFilename: input.preview.input.fileName,
      mimeType: input.preview.input.mimeType,
      fileSize: input.preview.input.fileSize,
      width: input.preview.media.width,
      height: input.preview.media.height,
      sha256Hash: input.preview.media.sha256Hash,
      exifJson: input.preview.media.exifJson,
      capturedAt: input.preview.input.captureTimestamp,
      uploadedAt: now,
    });
    state.reportStatusHistory.push({
      id: randomUUID(),
      reportId,
      oldStatus: null,
      newStatus: "REPORTED",
      note: "Citizen report submitted.",
      changedByUserId: input.createdByUserId ?? null,
      createdAt: now,
    });

    await writeMockState(state);
    const detail = await this.getReportDetail(reportId);

    if (!detail) {
      throw new AppError("Report was created but could not be reloaded.", 500);
    }

    return detail;
  }

  async addComment(reportId: string, displayName: string, body: string, userId?: string | null) {
    const { state } = await this.getReportOrThrow(reportId);

    const comment: ReportComment = {
      id: randomUUID(),
      reportId,
      userId: userId ?? null,
      displayName,
      body,
      moderationStatus: "PENDING",
      createdAt: new Date().toISOString(),
    };

    state.reportComments.push(comment);
    await writeMockState(state);
    return comment;
  }

  async addVote(reportId: string, sessionKey: string, userId?: string | null) {
    const { state } = await this.getReportOrThrow(reportId);
    const exists = state.reportVotes.some(
      (vote) =>
        vote.reportId === reportId &&
        ((userId && vote.userId === userId) || (!userId && vote.sessionKey === sessionKey)),
    );

    if (!exists) {
      state.reportVotes.push({
        id: randomUUID(),
        reportId,
        userId: userId ?? null,
        sessionKey,
        createdAt: new Date().toISOString(),
      });
      await writeMockState(state);
    }

    return {
      count: state.reportVotes.filter((vote) => vote.reportId === reportId).length,
      created: !exists,
    };
  }

  async hasVote(reportId: string, sessionKey: string, userId?: string | null) {
    const { state } = await this.getReportOrThrow(reportId);
    return state.reportVotes.some(
      (vote) =>
        vote.reportId === reportId &&
        ((userId && vote.userId === userId) || (!userId && vote.sessionKey === sessionKey)),
    );
  }

  async updateStatus(reportId: string, status: ReportStatus, note: string, changedByUserId?: string | null) {
    const { state, report } = await this.getReportOrThrow(reportId);
    const previousStatus = report.status;
    report.status = status;
    report.updatedAt = new Date().toISOString();

    state.reportStatusHistory.push({
      id: randomUUID(),
      reportId,
      oldStatus: previousStatus,
      newStatus: status,
      note,
      changedByUserId: changedByUserId ?? null,
      createdAt: report.updatedAt,
    });

    state.moderationLogs.push({
      id: randomUUID(),
      reportId,
      moderatorId: changedByUserId ?? null,
      actionType: "STATUS_CHANGE",
      reason: note,
      metadataJson: { previousStatus, status },
      createdAt: report.updatedAt,
    });

    await writeMockState(state);
    return (await this.getReportDetail(reportId)) as ReportDetail;
  }

  async updateModeration(
    reportId: string,
    moderationStatus: ModerationStatus,
    reason: string,
    moderatorId?: string | null,
  ) {
    const { state, report } = await this.getReportOrThrow(reportId);
    report.moderationStatus = moderationStatus;
    report.updatedAt = new Date().toISOString();

    state.moderationLogs.push({
      id: randomUUID(),
      reportId,
      moderatorId: moderatorId ?? null,
      actionType: "MODERATION_CHANGE",
      reason,
      metadataJson: { moderationStatus },
      createdAt: report.updatedAt,
    });

    await writeMockState(state);
    return (await this.getReportDetail(reportId)) as ReportDetail;
  }

  async findDuplicateCandidates(input: {
    sha256Hash: string;
    latitude: number;
    longitude: number;
    sessionFingerprintHash?: string | null;
    timeWindowHours?: number;
  }) {
    const { items } = await this.buildReportListItems();
    const windowStart = Date.now() - (input.timeWindowHours ?? 72) * 60 * 60 * 1000;

    const sameImageMatches = items.filter((item) =>
      item.media.some((media) => media.sha256Hash === input.sha256Hash),
    );

    const nearbyMatches = items
      .map((item) => ({
        ...item,
        distanceMeters: haversineDistanceMeters(
          input.latitude,
          input.longitude,
          item.report.latitude,
          item.report.longitude,
        ),
      }))
      .filter(
        (item) =>
          item.distanceMeters <= 120 &&
          Date.parse(item.report.createdAt) >= windowStart,
      );

    const sessionMatches = input.sessionFingerprintHash
      ? items.filter(
          (item) =>
            item.report.deviceFingerprintHash === input.sessionFingerprintHash &&
            Date.parse(item.report.createdAt) >= windowStart,
        )
      : [];

    return {
      sameImageMatches,
      nearbyMatches,
      sessionMatches,
    };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const { items } = await this.buildReportListItems();
    const unresolvedStatuses: Array<ReportStatus> = ["REPORTED", "VERIFIED", "FORWARDED", "IN_PROGRESS"];

    return {
      totalReports: items.length,
      unresolvedReports: items.filter((item) => unresolvedStatuses.includes(item.report.status)).length,
      resolvedReports: items.filter((item) => item.report.status === "RESOLVED").length,
      averageTrustScore:
        items.length > 0
          ? Number(
              (
                items.reduce((sum, item) => sum + item.report.trustScore, 0) / items.length
              ).toFixed(1),
            )
          : 0,
      highSeverityReports: items.filter(
        (item) => item.report.severity === "HIGH" || item.report.severity === "CRITICAL",
      ).length,
    };
  }

  async getRepresentativeReportItems(representativeId: string) {
    const { items } = await this.buildReportListItems();
    return items.filter(
      (item) =>
        item.report.mlaRepresentativeId === representativeId ||
        item.report.mpRepresentativeId === representativeId,
    );
  }
}
