import { booleanPointInPolygon, point } from "@turf/turf";

import { severityMapColors, wasteTypeLabels } from "@/lib/civic/constants";
import type { ReportListItem, WardBoundary } from "@/lib/civic/types";

export type CivicMapWard = {
  id: string;
  number: number;
  name: string;
  zone: string;
  boundaryGeojson: WardBoundary["boundaryGeojson"];
};

export type CivicMapReport = {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  severity: ReportListItem["report"]["severity"];
  status: ReportListItem["report"]["status"];
  reporterCount: number;
  wasteTypeLabel: string;
  wardLabel: string;
};

export type WardOption = {
  id: string;
  label: string;
  number: number;
  name: string;
  zone: string;
};

export const BHUBANESWAR_CENTER: [number, number] = [20.2961, 85.8245];

export function formatWardLabel(ward: Pick<WardBoundary, "number" | "name">) {
  return `Ward ${ward.number} - ${ward.name}`;
}

export function toWardOptions(wards: WardBoundary[]): WardOption[] {
  return [...wards]
    .sort((left, right) => left.number - right.number)
    .map((ward) => ({
      id: ward.id,
      label: formatWardLabel(ward),
      number: ward.number,
      name: ward.name,
      zone: ward.zone,
    }));
}

export function toMapWards(wards: WardBoundary[]): CivicMapWard[] {
  return [...wards]
    .sort((left, right) => left.number - right.number)
    .map((ward) => ({
      id: ward.id,
      number: ward.number,
      name: ward.name,
      zone: ward.zone,
      boundaryGeojson: ward.boundaryGeojson,
    }));
}

export function isPointInsideWardBounds(wards: WardBoundary[], lat: number, lng: number) {
  return wards.some((ward) =>
    booleanPointInPolygon(point([lng, lat]), ward.boundaryGeojson as never),
  );
}

export function toMapReports(items: ReportListItem[], wards: WardBoundary[]): CivicMapReport[] {
  return items
    .filter((item) => isPointInsideWardBounds(wards, item.report.lat, item.report.lng))
    .map((item) => ({
      id: item.report.id,
      title: item.report.title,
      address: item.report.address,
      lat: item.report.lat,
      lng: item.report.lng,
      severity: item.report.severity,
      status: item.report.status,
      reporterCount: item.report.reporterCount,
      wasteTypeLabel: wasteTypeLabels[item.wasteType.key],
      wardLabel: formatWardLabel(item.ward),
    }));
}

export function getSeverityColor(severity: CivicMapReport["severity"]) {
  return severityMapColors[severity];
}
