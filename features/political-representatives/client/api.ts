"use client";

import type { PoliticalLookupApiResponse } from "@/features/political-representatives/shared/types";
import { readApiResponse } from "@/lib/utils/api-client";

export async function lookupPoliticalRepresentativesByCoordinates(
  latitude: number,
  longitude: number,
) {
  const response = await fetch("/api/political-representatives/by-location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude, longitude }),
  });
  const payload = await readApiResponse<PoliticalLookupApiResponse & { error?: string }>(response);

  if (!response.ok) {
    throw new Error(payload.error ?? "Representative lookup failed.");
  }

  return payload as PoliticalLookupApiResponse;
}
