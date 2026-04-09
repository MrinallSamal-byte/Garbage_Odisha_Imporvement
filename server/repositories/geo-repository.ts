import type { ConstituencyRecord, District, OdishaBoundaryRecord } from "@/types/domain";

export interface GeoRepository {
  findOdishaBoundaryContainingPoint(lat: number, lng: number): Promise<OdishaBoundaryRecord[]>;
  findDistrictsByPoint(lat: number, lng: number): Promise<District[]>;
  findAssemblyConstituenciesByPoint(lat: number, lng: number): Promise<ConstituencyRecord[]>;
  findParliamentConstituenciesByPoint(lat: number, lng: number): Promise<ConstituencyRecord[]>;
}
