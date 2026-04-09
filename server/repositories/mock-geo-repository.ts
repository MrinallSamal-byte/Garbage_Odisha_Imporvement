import { booleanPointInPolygon, point } from "@turf/turf";
import type { Feature, MultiPolygon } from "geojson";

import type { ConstituencyRecord, District, OdishaBoundaryRecord } from "@/types/domain";
import { readMockState } from "@/lib/mock/runtime-store";

import type { GeoRepository } from "./geo-repository";

function includesPoint(
  geometryRecord: {
    geometry: Feature<MultiPolygon> | null;
  },
  lat: number,
  lng: number,
) {
  if (!geometryRecord.geometry) {
    return false;
  }

  return booleanPointInPolygon(point([lng, lat]), geometryRecord.geometry as never);
}

export class MockGeoRepository implements GeoRepository {
  async findOdishaBoundaryContainingPoint(lat: number, lng: number): Promise<OdishaBoundaryRecord[]> {
    const state = await readMockState();
    return state.odishaBoundary.filter((record) => includesPoint(record, lat, lng));
  }

  async findDistrictsByPoint(lat: number, lng: number): Promise<District[]> {
    const state = await readMockState();
    return state.districts.filter((record) => includesPoint(record, lat, lng));
  }

  async findAssemblyConstituenciesByPoint(lat: number, lng: number): Promise<ConstituencyRecord[]> {
    const state = await readMockState();
    return state.assemblyConstituencies.filter((record) => includesPoint(record, lat, lng));
  }

  async findParliamentConstituenciesByPoint(
    lat: number,
    lng: number,
  ): Promise<ConstituencyRecord[]> {
    const state = await readMockState();
    return state.parliamentConstituencies.filter((record) => includesPoint(record, lat, lng));
  }
}
