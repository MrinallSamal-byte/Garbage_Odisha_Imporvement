import type { FeatureCollection, MultiPolygon } from "geojson";

import { wasteTypeLabels } from "@/lib/civic/constants";
import { buildPartyAcronym } from "@/lib/civic/helpers";
import type {
  OfficialBoundary,
  ReportRecord,
  WasteTypeRecord,
  WardBoundary,
} from "@/lib/civic/types";
import mlasGeojson from "@/data/civic/mlas.geojson";
import mpsGeojson from "@/data/civic/mps.geojson";
import reportsJson from "@/data/civic/reports.json";
import wardsGeojson from "@/data/civic/wards.geojson";

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

type SeedReport = typeof reportsJson;

export const mockWasteTypes: WasteTypeRecord[] = Object.entries(wasteTypeLabels).map(([key, label], index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  key: key as WasteTypeRecord["key"],
  label,
  description: null,
}));

export const mockWards: WardBoundary[] = (wardsGeojson as WardFeatureCollection).features.map((feature) => ({
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

export const mockMlas = mapOfficialCollection(mlasGeojson as OfficialFeatureCollection);
export const mockMps = mapOfficialCollection(mpsGeojson as OfficialFeatureCollection);

const wasteTypesById = new Map(mockWasteTypes.map((item) => [item.id, item]));

export const mockReports: ReportRecord[] = (reportsJson as SeedReport).map((report, index) => ({
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
