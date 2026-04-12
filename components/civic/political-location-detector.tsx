"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, LocateFixed, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { readApiResponse } from "@/lib/utils/api-client";
import type { PoliticalLookupApiResponse } from "@/lib/political/types";
import { cn } from "@/lib/utils/cn";

type LocationState = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

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

function getGeolocationMessage(error: GeolocationPositionError) {
  if (error.code === 1) {
    return "Location permission was denied. Allow location access to detect your MLA and MP.";
  }

  if (error.code === 2) {
    return "Your location is currently unavailable. Check GPS/network and try again.";
  }

  if (error.code === 3) {
    return "Location request timed out. Move near an open area and try again.";
  }

  return error.message || "Unable to access your location.";
}

function ConfidenceBadge({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const variant = value >= 0.9 ? "success" : value >= 0.75 ? "warning" : "neutral";

  return <Badge variant={variant}>{percent}% confidence</Badge>;
}

export function PoliticalRepresentativeSummary({
  result,
  compact = false,
}: {
  result: PoliticalLookupApiResponse;
  compact?: boolean;
}) {
  if (!result.success) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-2">
            <p className="font-bold">{result.message}</p>
            {result.candidates?.length ? (
              <p className="text-xs leading-5">
                Possible constituencies: {result.candidates.join(", ")}
              </p>
            ) : null}
            <p className="text-xs leading-5">Matched by: {result.matched_by}</p>
          </div>
        </div>
      </div>
    );
  }

  const data = result.data;
  const rows = [
    ["Assembly constituency", data.assembly_constituency.name],
    ["Lok Sabha constituency", data.lok_sabha_constituency.name],
    ["MLA", `${data.mla.name} (${data.mla.party_short})`],
    ["MP", `${data.mp.name} (${data.mp.party_short})`],
  ];

  return (
    <div className={cn("rounded-md border border-civic-100 bg-civic-50/70", compact ? "p-3" : "p-5")}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="civic">{data.matched_by}</Badge>
        <ConfidenceBadge value={data.confidence_score} />
      </div>

      <div className="mt-4">
        <div className="flex items-start gap-2 text-sm text-slateblue-700">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-civic-700" />
          <span>{data.detected_location.formatted_address}</span>
        </div>
      </div>

      <div className={cn("mt-4 grid gap-2 text-sm", compact ? "" : "sm:grid-cols-2")}>
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/80 bg-white px-3 py-2">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slateblue-400">
              {label}
            </div>
            <div className="mt-1 font-bold text-ink">{value}</div>
          </div>
        ))}
      </div>

      {!compact && data.notes.length ? (
        <ul className="mt-4 space-y-1 text-xs leading-5 text-slateblue-700">
          {data.notes.map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PoliticalLocationDetector({
  onResult,
}: {
  onResult?: (result: PoliticalLookupApiResponse, location: LocationState) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationState | null>(null);
  const [result, setResult] = useState<PoliticalLookupApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function detectLocation() {
    setError(null);
    setResult(null);

    if (!navigator.geolocation) {
      setError("This browser does not support location access.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setLocation(nextLocation);

        try {
          const nextResult = await lookupPoliticalRepresentativesByCoordinates(
            nextLocation.latitude,
            nextLocation.longitude,
          );
          setResult(nextResult);
          onResult?.(nextResult, nextLocation);
        } catch (lookupError) {
          setError(lookupError instanceof Error ? lookupError.message : "Representative lookup failed.");
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setError(getGeolocationMessage(geoError));
        setLoading(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }

  return (
    <Card className="space-y-5 rounded-md p-5">
      <div className="space-y-2">
        <div className="section-label">Bhubaneswar representatives</div>
        <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">
          Detect your MLA and MP
        </h1>
        <p className="text-sm leading-6 text-slateblue-700">
          GPS starts the lookup, then the backend checks polygons, ward, gram panchayat, and locality keywords before returning a confidence level.
        </p>
      </div>

      <Button onClick={() => void detectLocation()} disabled={loading} className="w-full rounded-md">
        {loading ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LocateFixed className="mr-2 h-4 w-4" />
        )}
        {loading ? "Detecting..." : "Detect My Location"}
      </Button>

      {location ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          GPS locked - {Math.round(location.accuracy)} m accuracy
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold leading-5 text-rose-800">
          {error}
        </div>
      ) : null}

      {result ? <PoliticalRepresentativeSummary result={result} /> : null}
    </Card>
  );
}
