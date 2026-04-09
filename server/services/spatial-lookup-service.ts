import type { ConstituencyLookupResult } from "@/types/domain";

import { getGeoRepository, getRepresentativeRepository } from "@/server/repositories/repository-factory";

export async function lookupRepresentativesByPoint(
  lat: number,
  lng: number,
): Promise<ConstituencyLookupResult> {
  const geoRepository = getGeoRepository();
  const representativeRepository = getRepresentativeRepository();

  const [districts, assemblyMatches, parliamentMatches] = await Promise.all([
    geoRepository.findDistrictsByPoint(lat, lng),
    geoRepository.findAssemblyConstituenciesByPoint(lat, lng),
    geoRepository.findParliamentConstituenciesByPoint(lat, lng),
  ]);

  const reviewNotes: string[] = [];

  if (districts.length > 1) {
    reviewNotes.push("Point intersects more than one district geometry in the current dataset.");
  }

  if (assemblyMatches.length > 1) {
    reviewNotes.push("Point lies on or near an assembly boundary edge and matched multiple polygons.");
  }

  if (parliamentMatches.length > 1) {
    reviewNotes.push("Point lies on or near a parliamentary boundary edge and matched multiple polygons.");
  }

  const district = districts[0] ?? null;
  const assemblyConstituency = assemblyMatches[0] ?? null;
  const parliamentConstituency = parliamentMatches[0] ?? null;

  const [mla, mp] = await Promise.all([
    assemblyConstituency
      ? representativeRepository.getActiveMlaByAssemblyConstituencyId(assemblyConstituency.id)
      : Promise.resolve(null),
    parliamentConstituency
      ? representativeRepository.getActiveMpByParliamentConstituencyId(parliamentConstituency.id)
      : Promise.resolve(null),
  ]);

  return {
    district,
    assemblyConstituency,
    parliamentConstituency,
    mla,
    mp,
    reviewNotes,
  };
}

export async function isPointInsideOdisha(lat: number, lng: number) {
  const geoRepository = getGeoRepository();
  const matches = await geoRepository.findOdishaBoundaryContainingPoint(lat, lng);
  return matches.length > 0;
}
