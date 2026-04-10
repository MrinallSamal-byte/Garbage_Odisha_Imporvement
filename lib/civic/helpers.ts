import type { Feature, MultiPolygon } from "geojson";

import { partyAcronyms } from "@/lib/civic/constants";

export function buildPartyAcronym(party: string) {
  return (
    partyAcronyms[party] ??
    party
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 4)
  );
}

export function parseBoundaryGeojson(
  value: Feature<MultiPolygon> | MultiPolygon | string,
): MultiPolygon {
  const parsed =
    typeof value === "string"
      ? (JSON.parse(value) as Feature<MultiPolygon> | MultiPolygon)
      : value;

  return parsed.type === "Feature" ? parsed.geometry : parsed;
}

export function toIsoString(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function getDaysOpen(createdAt: string, resolvedAt?: string | null) {
  const created = new Date(createdAt);
  const end = resolvedAt ? new Date(resolvedAt) : new Date();
  const difference = end.getTime() - created.getTime();
  return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
}

export function buildReportTitle(landmark: string, wardNumber: number) {
  const trimmedLandmark = landmark.trim();

  if (trimmedLandmark) {
    return `Garbage near ${trimmedLandmark}`;
  }

  return `Garbage report in Ward #${wardNumber}`;
}
