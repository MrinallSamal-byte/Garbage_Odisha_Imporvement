import type { ConstituencyLookupResult } from "@/types/domain";
import { getReverseGeocoder, type ReverseGeocoder } from "@/lib/geo/reverse-geocoder";
import {
  confidenceFromKeywordScore,
  findAmbiguousKeywordMatches,
  findGpMatchFromAddress,
  findRecordByAssemblyName,
  findWardMatchFromAddress,
  getTopKeywordMatch,
  inferAmbiguousCandidates,
  scoreKeywordMatches,
} from "@/lib/political/matcher";
import {
  buildNormalizedLocationCandidates,
  formatDetectedLocation,
} from "@/lib/political/normalization";
import type {
  KeywordScore,
  PoliticalAreaMapping,
  PoliticalAreaRecord,
  PoliticalLookupApiResponse,
  PoliticalLookupDebug,
  PoliticalMatchSource,
  PoliticalReverseGeocodeResult,
} from "@/lib/political/types";
import { AppError } from "@/lib/utils/errors";
import {
  getPoliticalAreaMappingRepository,
  type PoliticalAreaMappingRepository,
} from "@/server/repositories/political-area-mapping-repository";
import { lookupRepresentativesByPoint } from "@/server/services/spatial-lookup-service";

type PoliticalLookupDependencies = {
  reverseGeocoder?: ReverseGeocoder;
  mappingRepository?: PoliticalAreaMappingRepository;
  polygonLookup?: (lat: number, lng: number) => Promise<ConstituencyLookupResult>;
};

function shouldIncludeDebug() {
  return process.env.NODE_ENV !== "production";
}

function toPoliticalOfficial(record: PoliticalAreaRecord) {
  return {
    name: record.mla_name,
    party_full: record.mla_party_full,
    party_short: record.mla_party_short,
  };
}

function toPoliticalMp(record: PoliticalAreaRecord, mapping: PoliticalAreaMapping) {
  return {
    name: record.mp?.name ?? mapping.mp_common_for_all_bhubaneswar_lok_sabha_segments.mp_name,
    party_full:
      record.mp?.party_full ??
      mapping.mp_common_for_all_bhubaneswar_lok_sabha_segments.mp_party_full,
    party_short:
      record.mp?.party_short ??
      mapping.mp_common_for_all_bhubaneswar_lok_sabha_segments.mp_party_short,
  };
}

function buildSuccessResponse({
  latitude,
  longitude,
  address,
  mapping,
  record,
  matchedBy,
  confidenceScore,
  notes,
  debug,
}: {
  latitude: number;
  longitude: number;
  address: PoliticalReverseGeocodeResult;
  mapping: PoliticalAreaMapping;
  record: PoliticalAreaRecord;
  matchedBy: Exclude<PoliticalMatchSource, "keyword_ambiguous" | "fallback" | "none">;
  confidenceScore: number;
  notes: string[];
  debug: PoliticalLookupDebug;
}): PoliticalLookupApiResponse {
  const mla = toPoliticalOfficial(record);
  const mp = toPoliticalMp(record, mapping);
  const response: PoliticalLookupApiResponse = {
    success: true,
    data: {
      status: "matched",
      latitude,
      longitude,
      detected_location: formatDetectedLocation(address),
      assembly_constituency: {
        number: record.assembly_constituency_no,
        name: record.assembly_constituency_name,
      },
      lok_sabha_constituency: {
        name: mapping.mp_common_for_all_bhubaneswar_lok_sabha_segments.lok_sabha_constituency,
      },
      mla,
      mla_party: {
        full: mla.party_full,
        short: mla.party_short,
      },
      mp,
      mp_party: {
        full: mp.party_full,
        short: mp.party_short,
      },
      matched_by: matchedBy,
      confidence_score: confidenceScore,
      notes,
    },
  };

  return shouldIncludeDebug() ? { ...response, debug } : response;
}

function buildFailureResponse(
  response: Omit<PoliticalLookupApiResponse & { success: false }, "debug">,
  debug: PoliticalLookupDebug,
): PoliticalLookupApiResponse {
  return shouldIncludeDebug() ? { ...response, debug } : response;
}

function toDebug({
  address,
  keywordScores,
  matchedKeywords,
  polygonLookupNotes,
  alternatives,
}: {
  address: PoliticalReverseGeocodeResult;
  keywordScores: KeywordScore[];
  matchedKeywords?: string[];
  polygonLookupNotes: string[];
  alternatives?: string[];
}): PoliticalLookupDebug {
  return {
    normalized_candidates: buildNormalizedLocationCandidates(address),
    matched_keywords: matchedKeywords ?? [],
    score_breakdown: keywordScores
      .filter((score) => score.score > 0)
      .map((score) => ({
        assembly_constituency: score.record.assembly_constituency_name,
        score: score.score,
        matched_keywords: score.matchedKeywords,
        evidence: score.evidence,
      })),
    alternatives:
      alternatives ??
      keywordScores
        .filter((score) => score.score > 0)
        .slice(0, 3)
        .map((score) => score.record.assembly_constituency_name),
    reverse_geocode_source: address.source,
    polygon_lookup_notes: polygonLookupNotes,
  };
}

function approximateFallbackNotes(polygonLookupNotes: string[]) {
  return [
    ...polygonLookupNotes,
    "This is an approximate match based on reverse geocoded locality + ward/GP + keyword mapping.",
  ];
}

export async function findRepresentativesByLocation(
  latitude: number,
  longitude: number,
  dependencies: PoliticalLookupDependencies = {},
): Promise<PoliticalLookupApiResponse> {
  const reverseGeocoder = dependencies.reverseGeocoder ?? getReverseGeocoder();
  const mappingRepository =
    dependencies.mappingRepository ?? getPoliticalAreaMappingRepository();
  const polygonLookup = dependencies.polygonLookup ?? lookupRepresentativesByPoint;

  const [address, mapping] = await Promise.all([
    reverseGeocoder.reverseGeocode(latitude, longitude),
    mappingRepository.getActiveMapping("Bhubaneswar", "Odisha"),
  ]);

  if (!mapping) {
    throw new AppError("Active Bhubaneswar political mapping is not configured.", 500);
  }

  const candidates = buildNormalizedLocationCandidates(address);
  let polygonLookupResult: ConstituencyLookupResult | null = null;
  const polygonLookupNotes: string[] = [];

  try {
    polygonLookupResult = await polygonLookup(latitude, longitude);
    polygonLookupNotes.push(...polygonLookupResult.reviewNotes);
  } catch {
    polygonLookupNotes.push("Polygon lookup failed, so fallback matching was used.");
  }

  const keywordScores = scoreKeywordMatches(mapping, candidates);
  const baseDebug = (matchedKeywords?: string[], alternatives?: string[]) =>
    toDebug({
      address,
      keywordScores,
      matchedKeywords,
      polygonLookupNotes,
      alternatives,
    });

  // Mode A: a polygon containment match is exact enough to return immediately,
  // but only after mapping the polygon name back to the active political JSON.
  if (polygonLookupResult?.assemblyConstituency) {
    const polygonRecord = findRecordByAssemblyName(
      mapping,
      polygonLookupResult.assemblyConstituency.name,
    );

    if (polygonRecord) {
      return buildSuccessResponse({
        latitude,
        longitude,
        address,
        mapping,
        record: polygonRecord,
        matchedBy: "polygon",
        confidenceScore: 0.98,
        notes: [
          `Matched through assembly constituency polygon: ${polygonLookupResult.assemblyConstituency.name}`,
          "Exact geospatial Mode A lookup used.",
          ...polygonLookupNotes,
        ],
        debug: baseDebug(),
      });
    }

    polygonLookupNotes.push(
      `Polygon matched ${polygonLookupResult.assemblyConstituency.name}, but that constituency was not found in the active Bhubaneswar political JSON.`,
    );
  } else {
    polygonLookupNotes.push("Polygon data was not available or did not contain this point, so fallback logic was used.");
  }

  // Mode B priority 1: reverse geocoders sometimes return an official BMC ward.
  // This is still approximate because it depends on the geocoder's admin labels.
  const wardMatch = findWardMatchFromAddress(mapping, address);
  if (wardMatch) {
    return buildSuccessResponse({
      latitude,
      longitude,
      address,
      mapping,
      record: wardMatch.record,
      matchedBy: "ward",
      confidenceScore: 0.92,
      notes: [
        `Matched through reverse geocoded BMC ward: ${wardMatch.wardNumber}`,
        ...approximateFallbackNotes(polygonLookupNotes),
      ],
      debug: baseDebug(),
    });
  }

  // Mode B priority 2: gram panchayat names can be more reliable than locality
  // keywords around urban expansion edges.
  const gpMatch = findGpMatchFromAddress(mapping, address);
  if (gpMatch) {
    return buildSuccessResponse({
      latitude,
      longitude,
      address,
      mapping,
      record: gpMatch.record,
      matchedBy: "gp",
      confidenceScore: 0.9,
      notes: [
        `Matched through reverse geocoded gram panchayat/village: ${gpMatch.gp}`,
        ...approximateFallbackNotes(polygonLookupNotes),
      ],
      debug: baseDebug(),
    });
  }

  // Mode B priority 3: locality keywords are the final automated fallback.
  // We never pick a random top result when scores are close or known ambiguous.
  const { top, second, accepted, close } = getTopKeywordMatch(keywordScores);
  const ambiguousMatches = findAmbiguousKeywordMatches(mapping, candidates);

  if (accepted && top) {
    return buildSuccessResponse({
      latitude,
      longitude,
      address,
      mapping,
      record: top.record,
      matchedBy: "keyword",
      confidenceScore: confidenceFromKeywordScore(top.score),
      notes: [
        `Matched through normalized locality keyword: ${top.matchedKeywords.join(", ")}`,
        ...approximateFallbackNotes(polygonLookupNotes),
      ],
      debug: baseDebug(top.matchedKeywords),
    });
  }

  if (ambiguousMatches.length || close) {
    const candidatesForReview = inferAmbiguousCandidates(
      mapping,
      ambiguousMatches,
      [top, second].filter((score): score is KeywordScore => Boolean(score)),
    );

    return buildFailureResponse(
      {
        success: false,
        status: "ambiguous",
        error_code: "AMBIGUOUS_MATCH",
        message: "Location could not be mapped confidently to a single assembly constituency.",
        candidates: candidatesForReview,
        matched_by: "keyword_ambiguous",
        notes: [
          ...ambiguousMatches.map((match) => `${match.keyword}: ${match.reason}`),
          ...(close && top && second
            ? [
                `Top keyword scores are too close: ${top.record.assembly_constituency_name} (${top.score}) and ${second.record.assembly_constituency_name} (${second.score}).`,
              ]
            : []),
          ...approximateFallbackNotes(polygonLookupNotes),
        ],
      },
      baseDebug(
        [...(top?.matchedKeywords ?? []), ...(second?.matchedKeywords ?? [])],
        candidatesForReview,
      ),
    );
  }

  return buildFailureResponse(
    {
      success: false,
      status: "not_found",
      error_code: "NO_MATCH_FOUND",
      message: "No matching constituency found for the detected location.",
      matched_by: "none",
      notes: [
        "No polygon, ward, gram panchayat, or confident keyword match was found.",
        ...approximateFallbackNotes(polygonLookupNotes),
      ],
    },
    baseDebug(),
  );
}
