import type { ReverseGeocodeResult } from "@/types/domain";

export type PoliticalMatchSource =
  | "polygon"
  | "ward"
  | "gp"
  | "keyword"
  | "keyword_ambiguous"
  | "fallback"
  | "none";

export type PoliticalLookupErrorCode = "AMBIGUOUS_MATCH" | "NO_MATCH_FOUND";

export interface PoliticalRepresentativeParty {
  name: string;
  party_full: string;
  party_short: string;
}

export interface PoliticalOfficialExtent {
  bmc_wards?: number[];
  bmc_ward_based_match?: boolean;
  gram_panchayats?: string[];
  gram_panchayats_of_bhubaneswar_block?: string[];
  other_extent_markers?: string[];
}

export interface PoliticalAreaRecord {
  assembly_constituency_no: number;
  assembly_constituency_name: string;
  mla_name: string;
  mla_party_full: string;
  mla_party_short: string;
  official_extent: PoliticalOfficialExtent;
  match_keywords: string[];
  probable_post_delimitation_keywords_needing_gis_validation?: string[];
  mp: {
    name: string;
    party_full: string;
    party_short: string;
  };
}

export interface AmbiguousPoliticalKeyword {
  keyword: string;
  reason: string;
  resolve_using: string[];
  candidate_constituencies?: string[];
}

export interface PoliticalAreaMapping {
  meta: {
    city: string;
    state: string;
    country: string;
    generated_on: string;
    purpose: string;
    recommended_lookup_order?: string[];
    normalization_rules?: string[];
  };
  mp_common_for_all_bhubaneswar_lok_sabha_segments: {
    lok_sabha_constituency: string;
    mp_name: string;
    mp_party_full: string;
    mp_party_short: string;
    covers_assembly_segments: string[];
  };
  records: PoliticalAreaRecord[];
  ambiguous_keywords_require_secondary_check: AmbiguousPoliticalKeyword[];
}

export interface DetectedPoliticalLocation {
  formatted_address: string;
  locality: string | null;
  suburb: string | null;
  neighbourhood: string | null;
  ward: string | null;
  ward_number: number | null;
  gram_panchayat: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
}

export interface PoliticalLookupDebug {
  normalized_candidates: Array<{ field: string; raw: string; normalized: string }>;
  matched_keywords: string[];
  score_breakdown: Array<{
    assembly_constituency: string;
    score: number;
    matched_keywords: string[];
    evidence: string[];
  }>;
  alternatives: string[];
  reverse_geocode_source: string;
  polygon_lookup_notes: string[];
}

export interface PoliticalLookupSuccessData {
  status: "matched";
  latitude: number;
  longitude: number;
  detected_location: DetectedPoliticalLocation;
  assembly_constituency: {
    number: number;
    name: string;
  };
  lok_sabha_constituency: {
    name: string;
  };
  mla: PoliticalRepresentativeParty;
  mla_party: {
    full: string;
    short: string;
  };
  mp: PoliticalRepresentativeParty;
  mp_party: {
    full: string;
    short: string;
  };
  matched_by: Exclude<PoliticalMatchSource, "keyword_ambiguous" | "fallback" | "none">;
  confidence_score: number;
  notes: string[];
}

export interface PoliticalLookupSuccessResponse {
  success: true;
  data: PoliticalLookupSuccessData;
  debug?: PoliticalLookupDebug;
}

export interface PoliticalLookupFailureResponse {
  success: false;
  status: "ambiguous" | "not_found";
  error_code: PoliticalLookupErrorCode;
  message: string;
  candidates?: string[];
  matched_by: PoliticalMatchSource;
  notes?: string[];
  debug?: PoliticalLookupDebug;
}

export type PoliticalLookupApiResponse =
  | PoliticalLookupSuccessResponse
  | PoliticalLookupFailureResponse;

export interface NormalizedCandidate {
  field: string;
  raw: string;
  normalized: string;
}

export interface KeywordScore {
  record: PoliticalAreaRecord;
  score: number;
  matchedKeywords: string[];
  evidence: string[];
}

export type PoliticalReverseGeocodeResult = ReverseGeocodeResult;
