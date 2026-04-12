import type { NormalizedCandidate, PoliticalReverseGeocodeResult } from "@/features/political-representatives/shared/types";

const synonymPairs = [
  ["bhubaneshwar", "bhubaneswar"],
  ["bbsr", "bhubaneswar"],
  ["c s pur", "chandrasekharpur"],
  ["cs pur", "chandrasekharpur"],
  ["cspur", "chandrasekharpur"],
  ["jaydev vihar", "jayadev vihar"],
  ["info city", "infocity"],
  ["isckon", "iskcon"],
] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceWholePhrase(value: string, from: string, to: string) {
  const pattern = new RegExp(`(^|\\s)${escapeRegex(from)}(?=\\s|$)`, "g");
  return value.replace(pattern, (_, prefix: string) => `${prefix}${to}`);
}

export function normalizeLocationText(input: string | null | undefined) {
  if (!input) {
    return "";
  }

  let normalized = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.,/#!$%^*;:{}=_`~()?"'|[\]\\<>+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (let pass = 0; pass < 2; pass += 1) {
    for (const [from, to] of synonymPairs) {
      normalized = replaceWholePhrase(normalized, from, to);
    }
    normalized = normalized.replace(/\s+/g, " ").trim();
  }

  return normalized;
}

export function uniqueNormalizedValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => normalizeLocationText(value)).filter(Boolean)),
  );
}

export function extractWardNumber(...values: Array<string | number | null | undefined>) {
  for (const value of values) {
    if (typeof value === "number" && Number.isInteger(value)) {
      return value;
    }

    if (!value) {
      continue;
    }

    const normalized = normalizeLocationText(String(value));
    const explicit = normalized.match(/\b(?:bmc\s*)?ward(?:\s*no|\s*number)?\s*(\d{1,3})\b/);
    if (explicit) {
      return Number(explicit[1]);
    }
  }

  return null;
}

export function buildNormalizedLocationCandidates(
  address: PoliticalReverseGeocodeResult,
): NormalizedCandidate[] {
  const fields: Array<[string, string | null | undefined]> = [
    ["locality", address.locality],
    ["suburb", address.suburb],
    ["neighbourhood", address.neighbourhood],
    ["village", address.village],
    ["gram_panchayat", address.gramPanchayat],
    ["ward", address.wardName],
    ["block", address.blockName],
    ["city", address.city],
    ["district", address.districtName],
    ["pincode", address.postalCode],
    ["address", address.addressLine],
    ["formatted_address", address.formattedLabel],
  ];

  const seen = new Set<string>();
  const candidates: NormalizedCandidate[] = [];

  for (const [field, raw] of fields) {
    const value = raw?.trim();
    const normalized = normalizeLocationText(value);

    if (!value || !normalized || seen.has(`${field}:${normalized}`)) {
      continue;
    }

    seen.add(`${field}:${normalized}`);
    candidates.push({ field, raw: value, normalized });
  }

  return candidates;
}

export function formatDetectedLocation(address: PoliticalReverseGeocodeResult) {
  const wardNumber = address.wardNumber ?? extractWardNumber(address.wardName);
  const formattedAddress = address.formattedLabel || address.addressLine || "Unknown address";

  return {
    formatted_address: formattedAddress,
    locality: address.locality ?? null,
    suburb: address.suburb ?? null,
    neighbourhood: address.neighbourhood ?? null,
    ward: address.wardName ?? (wardNumber ? `Ward ${wardNumber}` : null),
    ward_number: wardNumber,
    gram_panchayat: address.gramPanchayat ?? address.village ?? null,
    city: address.city ?? null,
    district: address.districtName ?? null,
    state: address.stateName ?? null,
    pincode: address.postalCode ?? null,
  };
}
