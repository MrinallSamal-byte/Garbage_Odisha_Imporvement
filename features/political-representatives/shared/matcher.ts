import {
  buildNormalizedLocationCandidates,
  extractWardNumber,
  normalizeLocationText,
  uniqueNormalizedValues,
} from "@/features/political-representatives/shared/normalization";
import type {
  AmbiguousPoliticalKeyword,
  KeywordScore,
  NormalizedCandidate,
  PoliticalAreaMapping,
  PoliticalAreaRecord,
  PoliticalReverseGeocodeResult,
} from "@/features/political-representatives/shared/types";

function getRecordGramPanchayats(record: PoliticalAreaRecord) {
  return [
    ...(record.official_extent.gram_panchayats ?? []),
    ...(record.official_extent.gram_panchayats_of_bhubaneswar_block ?? []),
  ];
}

function includesNormalizedPhrase(candidate: string, phrase: string) {
  return candidate === phrase || candidate.includes(` ${phrase} `) || candidate.startsWith(`${phrase} `) || candidate.endsWith(` ${phrase}`);
}

export function findRecordByAssemblyName(mapping: PoliticalAreaMapping, assemblyName: string | null | undefined) {
  const normalizedAssemblyName = normalizeLocationText(assemblyName);

  if (!normalizedAssemblyName) {
    return null;
  }

  return (
    mapping.records.find((record) => {
      const normalizedRecordName = normalizeLocationText(record.assembly_constituency_name);
      return (
        normalizedRecordName === normalizedAssemblyName ||
        normalizedRecordName.includes(normalizedAssemblyName) ||
        normalizedAssemblyName.includes(normalizedRecordName)
      );
    }) ?? null
  );
}

export function findWardMatch(mapping: PoliticalAreaMapping, wardNumber: number | null) {
  if (!wardNumber) {
    return null;
  }

  return (
    mapping.records.find((record) => record.official_extent.bmc_wards?.includes(wardNumber)) ??
    null
  );
}

export function findGpMatch(mapping: PoliticalAreaMapping, gpName: string | null | undefined) {
  const normalizedGpName = normalizeLocationText(gpName);

  if (!normalizedGpName) {
    return null;
  }

  return (
    mapping.records.find((record) =>
      getRecordGramPanchayats(record).some(
        (gp) => normalizeLocationText(gp) === normalizedGpName,
      ),
    ) ?? null
  );
}

export function findGpMatchFromAddress(
  mapping: PoliticalAreaMapping,
  address: PoliticalReverseGeocodeResult,
) {
  const gpCandidates = [address.gramPanchayat, address.village];

  for (const candidate of gpCandidates) {
    const match = findGpMatch(mapping, candidate);
    if (match) {
      return {
        record: match,
        gp: candidate ?? "",
      };
    }
  }

  return null;
}

export function findWardMatchFromAddress(
  mapping: PoliticalAreaMapping,
  address: PoliticalReverseGeocodeResult,
) {
  const wardNumber = address.wardNumber ?? extractWardNumber(address.wardName, address.addressLine, address.formattedLabel);
  const record = findWardMatch(mapping, wardNumber);

  return record && wardNumber ? { record, wardNumber } : null;
}

export function scoreKeywordMatches(
  mapping: PoliticalAreaMapping,
  candidates: NormalizedCandidate[],
): KeywordScore[] {
  const formattedCandidates = candidates.filter((candidate) => candidate.field === "formatted_address" || candidate.field === "address");

  return mapping.records
    .map((record) => {
      let score = 0;
      const matchedKeywords = new Set<string>();
      const evidence: string[] = [];

      for (const rawKeyword of record.match_keywords) {
        const keyword = normalizeLocationText(rawKeyword);
        const keywordTokens = keyword.split(" ").filter(Boolean);

        if (!keyword) {
          continue;
        }

        for (const candidate of candidates) {
          if (candidate.normalized === keyword) {
            score += 5;
            matchedKeywords.add(rawKeyword);
            evidence.push(`${candidate.field} exactly matched "${rawKeyword}"`);
            continue;
          }

          if (includesNormalizedPhrase(candidate.normalized, keyword)) {
            const weight = formattedCandidates.includes(candidate) ? 2 : 4;
            score += weight;
            matchedKeywords.add(rawKeyword);
            evidence.push(`${candidate.field} contains "${rawKeyword}"`);
            continue;
          }

          if (
            keywordTokens.length > 1 &&
            keywordTokens.every((token) => candidate.normalized.includes(token))
          ) {
            score += 1;
            matchedKeywords.add(rawKeyword);
            evidence.push(`${candidate.field} contains all tokens from "${rawKeyword}"`);
          }
        }
      }

      return {
        record,
        score,
        matchedKeywords: Array.from(matchedKeywords),
        evidence,
      };
    })
    .sort((left, right) => right.score - left.score || left.record.assembly_constituency_name.localeCompare(right.record.assembly_constituency_name));
}

export function findAmbiguousKeywordMatches(
  mapping: PoliticalAreaMapping,
  candidates: NormalizedCandidate[],
) {
  const normalizedCandidates = candidates.map((candidate) => candidate.normalized);
  const matches: AmbiguousPoliticalKeyword[] = [];

  for (const ambiguous of mapping.ambiguous_keywords_require_secondary_check) {
    const keyword = normalizeLocationText(ambiguous.keyword);
    if (
      normalizedCandidates.some(
        (candidate) => candidate === keyword || includesNormalizedPhrase(candidate, keyword),
      )
    ) {
      matches.push(ambiguous);
    }
  }

  return matches;
}

export function inferAmbiguousCandidates(
  mapping: PoliticalAreaMapping,
  ambiguousMatches: AmbiguousPoliticalKeyword[],
  keywordScores: KeywordScore[],
) {
  const explicit = ambiguousMatches.flatMap((match) => match.candidate_constituencies ?? []);
  const scored = keywordScores
    .filter((score) => score.score > 0)
    .map((score) => score.record.assembly_constituency_name);

  return Array.from(new Set([...explicit, ...scored]));
}

export function getNormalizedGpList(record: PoliticalAreaRecord) {
  return uniqueNormalizedValues(getRecordGramPanchayats(record));
}

export function getTopKeywordMatch(scores: KeywordScore[]) {
  const [top, second] = scores;

  if (!top || top.score < 4) {
    return { top: top ?? null, second: second ?? null, accepted: false, close: false };
  }

  const close = Boolean(second && second.score > 0 && top.score - second.score < 2);
  return {
    top,
    second: second ?? null,
    accepted: !close,
    close,
  };
}

export function confidenceFromKeywordScore(score: number) {
  return Math.min(0.85, Math.max(0.7, 0.7 + score / 60));
}

export function buildAddressCandidates(address: PoliticalReverseGeocodeResult) {
  return buildNormalizedLocationCandidates(address);
}
