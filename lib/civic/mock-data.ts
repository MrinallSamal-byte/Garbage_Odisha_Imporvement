import fs from "node:fs";
import path from "node:path";

import type { FeatureCollection, MultiPolygon } from "geojson";

import { wasteTypeLabels } from "@/lib/civic/constants";
import { buildPartyAcronym } from "@/lib/civic/helpers";
import type {
  OfficialBoundary,
  ReportRecord,
  WasteTypeRecord,
  WardBoundary,
} from "@/lib/civic/types";

type OfficialFeatureCollection = FeatureCollection<
  MultiPolygon,
  {
    id: string;
    name: string;
    party: string;
    party_acronym?: string;
    party_logo_url: string;
    constituency_name: string;
    contact_email: string | null;
    contact_phone: string | null;
    profile_url: string | null;
  }
>;

type WardFeatureCollection = FeatureCollection<
  MultiPolygon,
  {
    id: string;
    number: number;
    name: string;
    zone: string;
  }
>;

type SeedReport = Array<{
  id: string;
  title: string;
  address: string;
  landmark: string | null;
  lat: number;
  lng: number;
  severity: string;
  status: string;
  reporter_count: number;
  photo_url: string;
  verification_photo_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}>;

function readCivicJson<T>(filename: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "civic", filename), "utf8"),
  ) as T;
}

const wardsGeojson = readCivicJson<WardFeatureCollection>("wards.geojson");
const mlasGeojson = readCivicJson<OfficialFeatureCollection>("mlas.geojson");
const mpsGeojson = readCivicJson<OfficialFeatureCollection>("mps.geojson");
const reportsJson = readCivicJson<SeedReport>("reports.json");

export const mockWasteTypes: WasteTypeRecord[] = Object.entries(wasteTypeLabels).map(([key, label], index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  key: key as WasteTypeRecord["key"],
  label,
  description: null,
}));

export const mockWards: WardBoundary[] = wardsGeojson.features.map((feature) => ({
  id: feature.properties.id,
  number: feature.properties.number,
  name: feature.properties.name,
  zone: feature.properties.zone,
  boundaryGeojson: {
    type: "Feature",
    properties: feature.properties,
    geometry: feature.geometry,
  },
}));

function mapOfficialCollection(collection: OfficialFeatureCollection): OfficialBoundary[] {
  return collection.features.map((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    party: feature.properties.party,
    partyAcronym:
      feature.properties.party_acronym ?? buildPartyAcronym(feature.properties.party),
    partyLogoUrl: feature.properties.party_logo_url,
    constituencyName: feature.properties.constituency_name,
    contactEmail: feature.properties.contact_email,
    contactPhone: feature.properties.contact_phone,
    profileUrl: feature.properties.profile_url,
    boundaryGeojson: {
      type: "Feature",
      properties: feature.properties,
      geometry: feature.geometry,
    },
  }));
}

export const mockMlas = mapOfficialCollection(mlasGeojson);
export const mockMps = mapOfficialCollection(mpsGeojson);

const wasteTypesById = new Map(mockWasteTypes.map((item) => [item.id, item]));

export const mockReports: ReportRecord[] = reportsJson.map((report, index) => ({
  id: report.id,
  reporterId: null,
  wardId: mockWards[index]?.id ?? mockWards[0].id,
  mlaId: index === 3 ? mockMlas[1].id : mockMlas[0].id,
  mpId: mockMps[0].id,
  wasteTypeId:
    index === 2
      ? mockWasteTypes.find((item) => item.key === "mixed")?.id ?? mockWasteTypes[0].id
      : index === 3
        ? mockWasteTypes.find((item) => item.key === "construction_debris")?.id ?? mockWasteTypes[0].id
        : mockWasteTypes[0].id,
  title: report.title,
  address: report.address,
  landmark: report.landmark,
  photoUrl: report.photo_url,
  verificationPhotoUrl: report.verification_photo_url,
  lat: report.lat,
  lng: report.lng,
  severity: report.severity as ReportRecord["severity"],
  status: report.status as ReportRecord["status"],
  reporterCount: report.reporter_count,
  createdAt: report.created_at,
  updatedAt: report.updated_at,
  resolvedAt: report.resolved_at,
}));

export function getMockWasteTypeById(id: string) {
  return wasteTypesById.get(id) ?? mockWasteTypes[0];
}
