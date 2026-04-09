import { randomUUID } from "crypto";

import {
  type AssemblyConstituency as PrismaAssemblyConstituency,
  type District as PrismaDistrict,
  type MediaAsset as PrismaMediaAsset,
  Prisma,
  type ParliamentConstituency as PrismaParliamentConstituency,
  type Report as PrismaReport,
  type ReportComment as PrismaReportComment,
  type ReportStatusHistory as PrismaReportStatusHistory,
  type Representative as PrismaRepresentative,
} from "@prisma/client";

import type {
  ConstituencyRecord,
  DashboardStats,
  District,
  MediaAsset,
  ModerationStatus,
  Report as DomainReport,
  ReportAiSummary,
  ReportComment,
  ReportDetail,
  ReportFilters,
  ReportListItem,
  ReportStatus,
  Representative,
} from "@/types/domain";
import { AppError } from "@/lib/utils/errors";
import { haversineDistanceMeters } from "@/lib/utils/geo";
import { prisma } from "@/lib/db/prisma";

import type { CreateReportFromPreviewInput, ReportRepository } from "./report-repository";

const reportInclude = {
  district: true,
  assemblyConstituency: true,
  parliamentConstituency: true,
  mlaRepresentative: true,
  mpRepresentative: true,
  mediaAssets: true,
  comments: true,
  votes: true,
} satisfies Prisma.ReportInclude;

function mapDistrict(district: PrismaDistrict | null): District | null {
  if (!district) {
    return null;
  }

  return {
    id: district.id,
    name: district.name,
    code: district.code,
    geometry: null,
    createdAt: district.createdAt.toISOString(),
    updatedAt: district.updatedAt.toISOString(),
  };
}

function mapConstituency(
  constituency: PrismaAssemblyConstituency | PrismaParliamentConstituency | null,
): ConstituencyRecord | null {
  if (!constituency) {
    return null;
  }

  return {
    id: constituency.id,
    code: constituency.code,
    name: constituency.name,
    districtName: "districtName" in constituency ? constituency.districtName : null,
    geometry: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [],
      },
    },
    metadataJson: (constituency.metadataJson as Record<string, unknown> | null) ?? {},
    createdAt: constituency.createdAt.toISOString(),
    updatedAt: constituency.updatedAt.toISOString(),
  };
}

function mapRepresentative(representative: PrismaRepresentative | null): Representative | null {
  if (!representative) {
    return null;
  }

  return {
    id: representative.id,
    representativeType: representative.representativeType,
    name: representative.name,
    constituencyType: representative.constituencyType,
    assemblyConstituencyId: representative.assemblyConstituencyId,
    parliamentConstituencyId: representative.parliamentConstituencyId,
    partyName: representative.partyName,
    isStateRulingParty: representative.isStateRulingParty,
    isCentralRulingParty: representative.isCentralRulingParty,
    oppositionLabel: representative.oppositionLabel,
    photoUrl: representative.photoUrl,
    officialRoleTitle: representative.officialRoleTitle,
    contactEmail: representative.contactEmail,
    contactPhone: representative.contactPhone,
    websiteUrl: representative.websiteUrl,
    socialLinksJson: (representative.socialLinksJson as Record<string, string> | null) ?? null,
    termStart: representative.termStart?.toISOString() ?? null,
    termEnd: representative.termEnd?.toISOString() ?? null,
    active: representative.active,
    lastVerifiedAt: representative.lastVerifiedAt?.toISOString() ?? null,
    createdAt: representative.createdAt.toISOString(),
    updatedAt: representative.updatedAt.toISOString(),
  };
}

function mapMedia(media: PrismaMediaAsset): MediaAsset {
  return {
    id: media.id,
    reportId: media.reportId,
    storageKey: media.storageKey,
    originalFilename: media.originalFilename,
    mimeType: media.mimeType,
    fileSize: media.fileSize,
    width: media.width,
    height: media.height,
    sha256Hash: media.sha256Hash,
    exifJson: (media.exifJson as Record<string, unknown> | null) ?? null,
    capturedAt: media.capturedAt?.toISOString() ?? null,
    uploadedAt: media.uploadedAt.toISOString(),
  };
}

function mapComment(comment: PrismaReportComment): ReportComment {
  return {
    id: comment.id,
    reportId: comment.reportId,
    userId: comment.userId,
    displayName: comment.displayName,
    body: comment.body,
    moderationStatus: comment.moderationStatus,
    createdAt: comment.createdAt.toISOString(),
  };
}

function mapReport(report: PrismaReport): DomainReport {
  return {
    id: report.id,
    reportCode: report.reportCode,
    sourceType: report.sourceType,
    description: report.description,
    category: report.category,
    severity: report.severity,
    status: report.status,
    moderationStatus: report.moderationStatus,
    trustScore: report.trustScore,
    gpsAccuracyMeters: report.gpsAccuracyMeters,
    latitude: report.latitude,
    longitude: report.longitude,
    locationPoint: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [report.longitude, report.latitude],
      },
    },
    addressLine: report.addressLine,
    locality: report.locality,
    wardName: report.wardName,
    blockName: report.blockName,
    districtId: report.districtId,
    assemblyConstituencyId: report.assemblyConstituencyId,
    parliamentConstituencyId: report.parliamentConstituencyId,
    mlaRepresentativeId: report.mlaRepresentativeId,
    mpRepresentativeId: report.mpRepresentativeId,
    aiIssueDetected: report.aiIssueDetected,
    aiIssueType: report.aiIssueType,
    aiConfidenceScore: report.aiConfidenceScore,
    aiGpsImageConsistency: report.aiGpsImageConsistency as DomainReport["aiGpsImageConsistency"],
    aiSuspiciousFlag: report.aiSuspiciousFlag,
    aiSummaryJson: report.aiSummaryJson as unknown as ReportAiSummary,
    anonymousFlag: report.anonymousFlag,
    createdByUserId: report.createdByUserId,
    deviceFingerprintHash: report.deviceFingerprintHash,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
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

export class PrismaReportRepository implements ReportRepository {
  private async loadReportItems() {
    const rows = await prisma.report.findMany({
      include: reportInclude,
      orderBy: { createdAt: "desc" },
    });

    return rows.map<ReportListItem>((row) => ({
      report: mapReport(row),
      district: mapDistrict(row.district),
      assemblyConstituency: mapConstituency(row.assemblyConstituency),
      parliamentConstituency: mapConstituency(row.parliamentConstituency),
      mla: mapRepresentative(row.mlaRepresentative),
      mp: mapRepresentative(row.mpRepresentative),
      media: row.mediaAssets.map(mapMedia),
      votes: row.votes.length,
      comments: row.comments.length,
    }));
  }

  async listPublicReports(filters?: ReportFilters): Promise<ReportListItem[]> {
    const items = await this.loadReportItems();
    return items
      .filter((item) => item.report.moderationStatus !== "REJECTED")
      .filter((item) => matchesFilters(item, filters));
  }

  async listAdminReports(): Promise<ReportListItem[]> {
    return this.loadReportItems();
  }

  async getReportDetail(reportId: string): Promise<ReportDetail | null> {
    const row = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        ...reportInclude,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      report: mapReport(row),
      district: mapDistrict(row.district),
      assemblyConstituency: mapConstituency(row.assemblyConstituency),
      parliamentConstituency: mapConstituency(row.parliamentConstituency),
      mla: mapRepresentative(row.mlaRepresentative),
      mp: mapRepresentative(row.mpRepresentative),
      media: row.mediaAssets.map(mapMedia),
      votes: row.votes.length,
      comments: row.comments.length,
      timeline: row.statusHistory.map((entry: PrismaReportStatusHistory) => ({
        id: entry.id,
        reportId: entry.reportId,
        oldStatus: entry.oldStatus,
        newStatus: entry.newStatus,
        note: entry.note,
        changedByUserId: entry.changedByUserId,
        createdAt: entry.createdAt.toISOString(),
      })),
      commentItems: row.comments.map(mapComment).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    };
  }

  async createReportFromPreview(input: CreateReportFromPreviewInput): Promise<ReportDetail> {
    const reportId = randomUUID();
    const reportSequence = await prisma.report.count();
    const reportCode = `SOD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
      reportSequence + 1,
    ).padStart(3, "0")}`;
    const moderationStatus =
      input.preview.aiSummary.suspiciousFlag || input.preview.duplicateDetection.suspicious
        ? "NEEDS_REVIEW"
        : "PENDING";
    const now = new Date();

    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "reports" (
          "id",
          "report_code",
          "source_type",
          "description",
          "category",
          "severity",
          "status",
          "moderation_status",
          "trust_score",
          "gps_accuracy_meters",
          "latitude",
          "longitude",
          "location_point",
          "address_line",
          "locality",
          "ward_name",
          "block_name",
          "district_id",
          "assembly_constituency_id",
          "parliament_constituency_id",
          "mla_representative_id",
          "mp_representative_id",
          "ai_issue_detected",
          "ai_issue_type",
          "ai_confidence_score",
          "ai_gps_image_consistency",
          "ai_suspicious_flag",
          "ai_summary_json",
          "anonymous_flag",
          "created_by_user_id",
          "device_fingerprint_hash",
          "created_at",
          "updated_at"
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          'REPORTED',
          $7,
          $8,
          $9,
          $10,
          $11,
          ST_SetSRID(ST_MakePoint($11, $10), 4326),
          $12,
          $13,
          $14,
          $15,
          $16,
          $17,
          $18,
          $19,
          $20,
          $21,
          $22,
          $23,
          $24,
          $25,
          $26::jsonb,
          $27,
          $28,
          $29,
          $30,
          $31
        )
      `,
      reportId,
      reportCode,
      input.preview.input.sourceType,
      input.description,
      input.preview.aiSummary.issueType,
      input.preview.aiSummary.garbageSeverity === "high"
        ? "HIGH"
        : input.preview.aiSummary.garbageSeverity === "medium"
          ? "MEDIUM"
          : "LOW",
      moderationStatus,
      input.preview.trustScore,
      input.preview.input.gpsAccuracyMeters,
      input.preview.input.latitude,
      input.preview.input.longitude,
      input.preview.address.addressLine,
      input.preview.address.locality,
      input.preview.address.wardName,
      input.preview.address.blockName,
      input.preview.lookup.district?.id ?? null,
      input.preview.lookup.assemblyConstituency?.id ?? null,
      input.preview.lookup.parliamentConstituency?.id ?? null,
      input.preview.lookup.mla?.id ?? null,
      input.preview.lookup.mp?.id ?? null,
      input.preview.aiSummary.issueDetected,
      input.preview.aiSummary.issueType,
      input.preview.aiSummary.confidenceScore,
      input.preview.aiSummary.gpsImageConsistency,
      input.preview.aiSummary.suspiciousFlag,
      JSON.stringify(input.preview.aiSummary),
      input.anonymousFlag,
      input.createdByUserId ?? null,
      input.preview.input.sessionFingerprintHash ?? null,
      now,
      now,
    );

    await prisma.mediaAsset.create({
      data: {
        reportId,
        storageKey: input.finalStorageKey,
        originalFilename: input.preview.input.fileName,
        mimeType: input.preview.input.mimeType,
        fileSize: input.preview.input.fileSize,
        width: input.preview.media.width,
        height: input.preview.media.height,
        sha256Hash: input.preview.media.sha256Hash,
        exifJson: (input.preview.media.exifJson as Prisma.InputJsonValue | null | undefined) ?? undefined,
        capturedAt: new Date(input.preview.input.captureTimestamp),
        uploadedAt: now,
      },
    });

    await prisma.reportStatusHistory.create({
      data: {
        reportId,
        oldStatus: null,
        newStatus: "REPORTED",
        note: "Citizen report submitted.",
        changedByUserId: input.createdByUserId ?? null,
        createdAt: now,
      },
    });

    const detail = await this.getReportDetail(reportId);
    if (!detail) {
      throw new AppError("Report created but failed to reload.", 500);
    }

    return detail;
  }

  async addComment(
    reportId: string,
    displayName: string,
    body: string,
    userId?: string | null,
  ): Promise<ReportComment> {
    const comment = await prisma.reportComment.create({
      data: {
        reportId,
        displayName,
        body,
        userId: userId ?? null,
        moderationStatus: "PENDING",
      },
    });

    return mapComment(comment);
  }

  async addVote(
    reportId: string,
    sessionKey: string,
    userId?: string | null,
  ): Promise<{ count: number; created: boolean }> {
    let created = true;

    try {
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO "report_votes" ("id", "report_id", "user_id", "session_key", "created_at")
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT ("report_id", "session_key") WHERE "session_key" IS NOT NULL DO NOTHING
        `,
        randomUUID(),
        reportId,
        userId ?? null,
        sessionKey,
      );
    } catch {
      created = false;
    }

    const count = await prisma.reportVote.count({
      where: { reportId },
    });

    return { count, created };
  }

  async updateStatus(
    reportId: string,
    status: ReportStatus,
    note: string,
    changedByUserId?: string | null,
  ): Promise<ReportDetail> {
    const existing = await prisma.report.findUnique({ where: { id: reportId } });

    if (!existing) {
      throw new AppError("Report not found.", 404);
    }

    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: {
          status,
        },
      }),
      prisma.reportStatusHistory.create({
        data: {
          reportId,
          oldStatus: existing.status,
          newStatus: status,
          note,
          changedByUserId: changedByUserId ?? null,
        },
      }),
      prisma.moderationLog.create({
        data: {
          reportId,
          moderatorId: changedByUserId ?? null,
          actionType: "STATUS_CHANGE",
          reason: note,
          metadataJson: { oldStatus: existing.status, status },
        },
      }),
    ]);

    return (await this.getReportDetail(reportId)) as ReportDetail;
  }

  async updateModeration(
    reportId: string,
    moderationStatus: ModerationStatus,
    reason: string,
    moderatorId?: string | null,
  ): Promise<ReportDetail> {
    const existing = await prisma.report.findUnique({ where: { id: reportId } });

    if (!existing) {
      throw new AppError("Report not found.", 404);
    }

    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: {
          moderationStatus,
        },
      }),
      prisma.moderationLog.create({
        data: {
          reportId,
          moderatorId: moderatorId ?? null,
          actionType: "MODERATION_CHANGE",
          reason,
          metadataJson: { moderationStatus },
        },
      }),
    ]);

    return (await this.getReportDetail(reportId)) as ReportDetail;
  }

  async findDuplicateCandidates(input: {
    sha256Hash: string;
    latitude: number;
    longitude: number;
    sessionFingerprintHash?: string | null;
    timeWindowHours?: number;
  }): Promise<{
    sameImageMatches: ReportListItem[];
    nearbyMatches: Array<ReportListItem & { distanceMeters: number }>;
    sessionMatches: ReportListItem[];
  }> {
    const items = await this.listAdminReports();
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
    const items = await this.listPublicReports();
    return {
      totalReports: items.length,
      unresolvedReports: items.filter((item) =>
        ["REPORTED", "VERIFIED", "FORWARDED", "IN_PROGRESS"].includes(item.report.status),
      ).length,
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

  async getRepresentativeReportItems(representativeId: string): Promise<ReportListItem[]> {
    const items = await this.listPublicReports();
    return items.filter(
      (item) =>
        item.report.mlaRepresentativeId === representativeId ||
        item.report.mpRepresentativeId === representativeId,
    );
  }
}
