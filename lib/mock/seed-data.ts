import { readFileSync } from "fs";
import path from "path";
import type { Feature, FeatureCollection, MultiPolygon, Point } from "geojson";

import type {
  ConstituencyRecord,
  District,
  MediaAsset,
  MockDatabaseState,
  OdishaBoundaryRecord,
  Report,
  ReportAiSummary,
  ReportComment,
  ReportStatusHistory,
  ReportVote,
  Representative,
  User,
} from "@/types/domain";

const seededAt = "2026-04-09T12:00:00.000Z";

type DistrictFeatureProperties = {
  id: string;
  name: string;
  code: string;
};

type ConstituencyFeatureProperties = {
  id: string;
  code: string;
  name: string;
  district_name?: string | null;
};

type BoundaryFeatureProperties = {
  id: string;
  name: string;
};

type LocalityPoint = {
  name: string;
  districtName: string;
  assemblyCode: string;
  parliamentCode: string;
  lat: number;
  lng: number;
};

function loadMockJson<T>(relativePath: string): T {
  const filePath = path.join(process.cwd(), relativePath);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

const adminUser: User = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "SafaOdisha Admin",
  email: "admin@safaodisha.local",
  phone: "+91-9000000001",
  passwordHash: null,
  role: "ADMIN",
  isActive: true,
  createdAt: seededAt,
  updatedAt: seededAt,
};

const moderatorUser: User = {
  id: "11111111-1111-4111-8111-222222222222",
  name: "District Moderator",
  email: "moderator@safaodisha.local",
  phone: "+91-9000000002",
  passwordHash: null,
  role: "MODERATOR",
  isActive: true,
  createdAt: seededAt,
  updatedAt: seededAt,
};

function mapDistricts() {
  const featureCollection = loadMockJson<FeatureCollection<MultiPolygon, DistrictFeatureProperties>>(
    "data/mock/districts.geojson",
  );

  return featureCollection.features.map<District>((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    code: feature.properties.code,
    geometry: feature,
    createdAt: seededAt,
    updatedAt: seededAt,
  }));
}

function mapConstituencies(
  source: FeatureCollection<MultiPolygon, ConstituencyFeatureProperties>,
): ConstituencyRecord[] {
  const localityPoints = loadMockJson<LocalityPoint[]>("data/mock/locality-points.json");
  return source.features.map((feature) => ({
    id: feature.properties.id,
    code: feature.properties.code,
    name: feature.properties.name,
    districtName: feature.properties.district_name ?? null,
    geometry: feature,
    metadataJson: {
      localityHints:
        localityPoints
          .filter((point) => point.assemblyCode === feature.properties.code || point.parliamentCode === feature.properties.code)
          .map((point) => point.name) ?? [],
    },
    createdAt: seededAt,
    updatedAt: seededAt,
  }));
}

function buildAiSummary(
  overrides: Partial<ReportAiSummary>,
): ReportAiSummary {
  return {
    issueDetected: true,
    issueType: "garbage",
    confidenceScore: 0.78,
    visibleLandmarks: [],
    detectedText: [],
    languageDetected: "mixed",
    likelyEnvironment: "public_space",
    garbageSeverity: "medium",
    gpsImageConsistency: "high",
    suspiciousFlag: false,
    moderationNotes: "Seeded mock analysis summary for local testing.",
    localityClues: [],
    ...overrides,
  };
}

function buildReports(): {
  reports: Report[];
  mediaAssets: MediaAsset[];
  statusHistory: ReportStatusHistory[];
  comments: ReportComment[];
  votes: ReportVote[];
} {
  const report1Ai = buildAiSummary({
    issueType: "overflow",
    confidenceScore: 0.91,
    visibleLandmarks: ["market frontage", "road divider"],
    detectedText: ["Nayapalli"],
    likelyEnvironment: "market",
    garbageSeverity: "high",
    localityClues: ["Nayapalli", "Bhubaneswar"],
    moderationNotes: "Garbage overflow appears consistent with dense roadside market surroundings.",
  });

  const report2Ai = buildAiSummary({
    issueType: "litter",
    confidenceScore: 0.82,
    visibleLandmarks: ["drain edge", "shop shutters"],
    detectedText: ["Cuttack Sadar"],
    likelyEnvironment: "roadside",
    garbageSeverity: "medium",
    localityClues: ["Cuttack Sadar"],
  });

  const reports: Report[] = [
    {
      id: "66666666-6666-4666-8666-111111111111",
      reportCode: "SOD-20260409-001",
      sourceType: "LIVE_CAPTURE",
      description: "Overflowing garbage pile beside Nayapalli market road and pedestrian edge.",
      category: "overflow",
      severity: "HIGH",
      status: "VERIFIED",
      moderationStatus: "APPROVED",
      trustScore: 88,
      gpsAccuracyMeters: 8,
      latitude: 20.2963,
      longitude: 85.8192,
      locationPoint: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [85.8192, 20.2963],
        },
      } as Feature<Point>,
      addressLine: "Nayapalli Market Road, Bhubaneswar, Khordha, Odisha 751012, India",
      locality: "Nayapalli",
      wardName: "Ward 31",
      blockName: "Bhubaneswar Municipal Corporation",
      districtId: "22220000-0000-4000-8000-111111111111",
      assemblyConstituencyId: "33330000-0000-4000-8000-111111111111",
      parliamentConstituencyId: "44440000-0000-4000-8000-111111111111",
      mlaRepresentativeId: "55550000-0000-4000-8000-111111111111",
      mpRepresentativeId: "55550000-0000-4000-8000-555555555555",
      aiIssueDetected: true,
      aiIssueType: "overflow",
      aiConfidenceScore: 0.91,
      aiGpsImageConsistency: "high",
      aiSuspiciousFlag: false,
      aiSummaryJson: report1Ai,
      anonymousFlag: true,
      createdByUserId: null,
      deviceFingerprintHash: "mock-session-1",
      createdAt: "2026-04-09T08:10:00.000Z",
      updatedAt: "2026-04-09T10:30:00.000Z",
    },
    {
      id: "66666666-6666-4666-8666-222222222222",
      reportCode: "SOD-20260409-002",
      sourceType: "GALLERY_UPLOAD",
      description: "Roadside litter and drain obstruction near Cuttack Sadar service lane.",
      category: "litter",
      severity: "MEDIUM",
      status: "RESOLVED",
      moderationStatus: "APPROVED",
      trustScore: 63,
      gpsAccuracyMeters: 24,
      latitude: 20.4624,
      longitude: 85.1788,
      locationPoint: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [85.1788, 20.4624],
        },
      } as Feature<Point>,
      addressLine: "Cuttack Sadar Main Road, Cuttack, Odisha 753003, India",
      locality: "Cuttack Sadar",
      wardName: null,
      blockName: "Cuttack Municipal Corporation",
      districtId: "22220000-0000-4000-8000-222222222222",
      assemblyConstituencyId: "33330000-0000-4000-8000-333333333333",
      parliamentConstituencyId: "44440000-0000-4000-8000-222222222222",
      mlaRepresentativeId: "55550000-0000-4000-8000-333333333333",
      mpRepresentativeId: "55550000-0000-4000-8000-666666666666",
      aiIssueDetected: true,
      aiIssueType: "litter",
      aiConfidenceScore: 0.82,
      aiGpsImageConsistency: "medium",
      aiSuspiciousFlag: false,
      aiSummaryJson: report2Ai,
      anonymousFlag: false,
      createdByUserId: null,
      deviceFingerprintHash: "mock-session-2",
      createdAt: "2026-04-08T16:45:00.000Z",
      updatedAt: "2026-04-09T09:40:00.000Z",
    },
  ];

  const mediaAssets: MediaAsset[] = [
    {
      id: "77777777-7777-4777-8777-111111111111",
      reportId: reports[0].id,
      storageKey: "seed/mock-report-1.svg",
      originalFilename: "mock-report-1.svg",
      mimeType: "image/svg+xml",
      fileSize: 2240,
      width: 1200,
      height: 900,
      sha256Hash: "seed-hash-1",
      exifJson: { mock: true },
      capturedAt: "2026-04-09T08:09:00.000Z",
      uploadedAt: "2026-04-09T08:10:00.000Z",
    },
    {
      id: "77777777-7777-4777-8777-222222222222",
      reportId: reports[1].id,
      storageKey: "seed/mock-report-2.svg",
      originalFilename: "mock-report-2.svg",
      mimeType: "image/svg+xml",
      fileSize: 2160,
      width: 1200,
      height: 900,
      sha256Hash: "seed-hash-2",
      exifJson: { mock: true },
      capturedAt: "2026-04-08T16:40:00.000Z",
      uploadedAt: "2026-04-08T16:45:00.000Z",
    },
  ];

  const statusHistory: ReportStatusHistory[] = [
    {
      id: "88888888-8888-4888-8888-111111111111",
      reportId: reports[0].id,
      oldStatus: null,
      newStatus: "REPORTED",
      note: "Citizen report received.",
      changedByUserId: null,
      createdAt: "2026-04-09T08:10:00.000Z",
    },
    {
      id: "88888888-8888-4888-8888-222222222222",
      reportId: reports[0].id,
      oldStatus: "REPORTED",
      newStatus: "VERIFIED",
      note: "Moderator verified visible garbage accumulation and accurate GPS match.",
      changedByUserId: moderatorUser.id,
      createdAt: "2026-04-09T10:30:00.000Z",
    },
    {
      id: "88888888-8888-4888-8888-333333333333",
      reportId: reports[1].id,
      oldStatus: null,
      newStatus: "REPORTED",
      note: "Gallery complaint logged for review.",
      changedByUserId: null,
      createdAt: "2026-04-08T16:45:00.000Z",
    },
    {
      id: "88888888-8888-4888-8888-444444444444",
      reportId: reports[1].id,
      oldStatus: "REPORTED",
      newStatus: "RESOLVED",
      note: "Local team uploaded cleanup proof and marked as resolved.",
      changedByUserId: adminUser.id,
      createdAt: "2026-04-09T09:40:00.000Z",
    },
  ];

  const comments: ReportComment[] = [
    {
      id: "99999999-9999-4999-8999-111111111111",
      reportId: reports[0].id,
      userId: null,
      displayName: "Resident watcher",
      body: "This stretch has been unmanaged for the last three mornings.",
      moderationStatus: "APPROVED",
      createdAt: "2026-04-09T11:15:00.000Z",
    },
    {
      id: "99999999-9999-4999-8999-222222222222",
      reportId: reports[1].id,
      userId: null,
      displayName: "Local volunteer",
      body: "Cleanup van came the same evening and the drain edge was cleared.",
      moderationStatus: "APPROVED",
      createdAt: "2026-04-09T09:55:00.000Z",
    },
  ];

  const votes: ReportVote[] = [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-111111111111",
      reportId: reports[0].id,
      userId: null,
      sessionKey: "support-session-1",
      createdAt: "2026-04-09T11:20:00.000Z",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-222222222222",
      reportId: reports[0].id,
      userId: null,
      sessionKey: "support-session-2",
      createdAt: "2026-04-09T11:22:00.000Z",
    },
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-333333333333",
      reportId: reports[1].id,
      userId: null,
      sessionKey: "support-session-3",
      createdAt: "2026-04-09T10:00:00.000Z",
    },
  ];

  return { reports, mediaAssets, statusHistory, comments, votes };
}

export function buildMockSeedState(): MockDatabaseState {
  const districts = mapDistricts();
  const assemblyConstituencies = mapConstituencies(
    loadMockJson<FeatureCollection<MultiPolygon, ConstituencyFeatureProperties>>(
      "data/mock/assembly-constituencies.geojson",
    ),
  );
  const parliamentConstituencies = mapConstituencies(
    loadMockJson<FeatureCollection<MultiPolygon, ConstituencyFeatureProperties>>(
      "data/mock/parliament-constituencies.geojson",
    ),
  );
  const boundaryFeatureCollection =
    loadMockJson<FeatureCollection<MultiPolygon, BoundaryFeatureProperties>>(
      "data/mock/odisha-boundary.geojson",
    );
  const odishaBoundary: OdishaBoundaryRecord[] = boundaryFeatureCollection.features.map((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    geometry: feature,
  }));

  const representativesJson = loadMockJson<Array<Record<string, unknown>>>("data/mock/representatives.json");
  const representatives: Representative[] = representativesJson.map(
    (representative) => ({
      id: String(representative.id),
      representativeType: representative.representativeType as Representative["representativeType"],
      name: String(representative.name),
      constituencyType: representative.constituencyType as Representative["constituencyType"],
      assemblyConstituencyId: (representative.assemblyConstituencyId as string | null) ?? null,
      parliamentConstituencyId: (representative.parliamentConstituencyId as string | null) ?? null,
      partyName: String(representative.partyName),
      isStateRulingParty: Boolean(representative.isStateRulingParty),
      isCentralRulingParty: Boolean(representative.isCentralRulingParty),
      oppositionLabel: (representative.oppositionLabel as string | null) ?? null,
      photoUrl: (representative.photoUrl as string | null) ?? null,
      officialRoleTitle: (representative.officialRoleTitle as string | null) ?? null,
      contactEmail: (representative.contactEmail as string | null) ?? null,
      contactPhone: (representative.contactPhone as string | null) ?? null,
      websiteUrl: (representative.websiteUrl as string | null) ?? null,
      socialLinksJson: Object.fromEntries(
        Object.entries((representative.socialLinksJson as Record<string, string | undefined> | null) ?? {}).filter(
          (
            entry,
          ): entry is [string, string] => typeof entry[1] === "string",
        ),
      ) as Record<string, string>,
      termStart: (representative.termStart as string | null) ?? null,
      termEnd: (representative.termEnd as string | null) ?? null,
      active: Boolean(representative.active),
      lastVerifiedAt: (representative.lastVerifiedAt as string | null) ?? null,
      createdAt: String(representative.createdAt),
      updatedAt: String(representative.updatedAt),
    }),
  );
  const reportSeed = buildReports();

  return {
    users: [adminUser, moderatorUser],
    parties: [
      {
        id: "12121212-1212-4121-8121-121212121212",
        name: "Biju Janata Dal",
        abbreviation: "BJD",
        levelScope: "STATE",
        isStateRulingPartyDefault: true,
        isCentralRulingPartyDefault: false,
        active: true,
        createdAt: seededAt,
        updatedAt: seededAt,
      },
      {
        id: "13131313-1313-4131-8131-131313131313",
        name: "Bharatiya Janata Party",
        abbreviation: "BJP",
        levelScope: "BOTH",
        isStateRulingPartyDefault: false,
        isCentralRulingPartyDefault: true,
        active: true,
        createdAt: seededAt,
        updatedAt: seededAt,
      },
      {
        id: "14141414-1414-4141-8141-141414141414",
        name: "Indian National Congress",
        abbreviation: "INC",
        levelScope: "NATIONAL",
        isStateRulingPartyDefault: false,
        isCentralRulingPartyDefault: false,
        active: true,
        createdAt: seededAt,
        updatedAt: seededAt,
      },
    ],
    districts,
    assemblyConstituencies,
    parliamentConstituencies,
    representatives,
    reports: reportSeed.reports,
    mediaAssets: reportSeed.mediaAssets,
    reportStatusHistory: reportSeed.statusHistory,
    reportComments: reportSeed.comments,
    reportVotes: reportSeed.votes,
    moderationLogs: [
      {
        id: "abababab-abab-4aba-8aba-111111111111",
        reportId: reportSeed.reports[0].id,
        moderatorId: moderatorUser.id,
        actionType: "VERIFY",
        reason: "Location and issue reviewed successfully.",
        metadataJson: { trustScore: 88 },
        createdAt: "2026-04-09T10:30:00.000Z",
      },
      {
        id: "abababab-abab-4aba-8aba-222222222222",
        reportId: reportSeed.reports[1].id,
        moderatorId: adminUser.id,
        actionType: "RESOLVE",
        reason: "Cleanup proof accepted.",
        metadataJson: { status: "RESOLVED" },
        createdAt: "2026-04-09T09:40:00.000Z",
      },
    ],
    odishaBoundary,
  };
}
