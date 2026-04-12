/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, LoaderCircle, LocateFixed, RotateCcw, X } from "lucide-react";

import { LazyBhubaneswarMap } from "@/components/civic/lazy-bhubaneswar-map";
import {
  PoliticalRepresentativeSummary,
} from "@/features/political-representatives/components/political-location-detector";
import { lookupPoliticalRepresentativesByCoordinates } from "@/features/political-representatives/client/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  reportSeverities,
  severityDescriptions,
  severityLabels,
  wasteTypeKeys,
  wasteTypeLabels,
} from "@/lib/civic/constants";
import type { ReportSeverity, WasteTypeKey } from "@/lib/civic/types";
import type { CivicMapReport, CivicMapWard, WardOption } from "@/lib/civic/map-view";
import type { PoliticalLookupApiResponse } from "@/features/political-representatives/shared/types";
import { cn } from "@/lib/utils/cn";

type LocationState = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

type LookupResponse = {
  ward?: {
    id: string;
    number: number;
    name: string;
  } | null;
  error?: string;
  warnings?: string[];
};

async function compressImage(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });

    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function ReportGarbageSheet({
  wardOptions,
  reports,
  wards,
}: {
  wardOptions: WardOption[];
  reports: CivicMapReport[];
  wards: CivicMapWard[];
}) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [wardId, setWardId] = useState("");
  const [location, setLocation] = useState<LocationState | null>(null);
  const [addressText, setAddressText] = useState("");
  const [landmark, setLandmark] = useState("");
  const [severity, setSeverity] = useState<ReportSeverity>("moderate");
  const [wasteType, setWasteType] = useState<WasteTypeKey>("mixed");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [politicalLookup, setPoliticalLookup] = useState<PoliticalLookupApiResponse | null>(null);
  const [politicalLookupError, setPoliticalLookupError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  async function handlePhotoChange(file: File | null) {
    setError(null);
    if (!file) return;

    const compressed = await compressImage(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
  }

  async function lookupLocation(latitude: number, longitude: number) {
    const [reverseResult, wardResult, politicalResult] = await Promise.allSettled([
      fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`),
      fetch(`/api/jurisdictions/lookup?lat=${latitude}&lng=${longitude}`),
      lookupPoliticalRepresentativesByCoordinates(latitude, longitude),
    ]);

    if (reverseResult.status === "fulfilled" && reverseResult.value.ok) {
      const reverse = (await reverseResult.value.json()) as { addressLine?: string; formattedLabel?: string };
      setAddressText((current) => current || reverse.addressLine || reverse.formattedLabel || "");
    }

    if (politicalResult.status === "fulfilled") {
      setPoliticalLookup(politicalResult.value);
      setPoliticalLookupError(null);
    } else {
      setPoliticalLookup(null);
      setPoliticalLookupError(
        politicalResult.reason instanceof Error
          ? politicalResult.reason.message
          : "Representative lookup failed.",
      );
    }

    if (wardResult.status !== "fulfilled") {
      throw new Error("Could not match this GPS point to a Bhubaneswar ward.");
    }

    const payload = (await wardResult.value.json()) as LookupResponse;
    if (!wardResult.value.ok || payload.error) {
      throw new Error(payload.error ?? "Could not match this GPS point to a Bhubaneswar ward.");
    }

    if (payload.ward?.id) {
      setWardId(payload.ward.id);
      return;
    }

    throw new Error(payload.warnings?.[0] ?? "Select the nearest Bhubaneswar ward manually.");
  }

  async function handleCurrentLocation() {
    setError(null);
    setPoliticalLookup(null);
    setPoliticalLookupError(null);
    setLoadingLocation(true);

    if (!navigator.geolocation) {
      setError("This browser does not support location access.");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLocation(nextLocation);

        try {
          await lookupLocation(nextLocation.latitude, nextLocation.longitude);
        } catch (lookupError) {
          setError(lookupError instanceof Error ? lookupError.message : "Location lookup failed.");
        } finally {
          setLoadingLocation(false);
        }
      },
      (geoError) => {
        setError(geoError.message || "Unable to access your location.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }

  async function submitReport() {
    setError(null);

    if (!photo) {
      setError("Take or upload a photo first.");
      return;
    }

    if (!wardId) {
      setError("Select a Bhubaneswar ward.");
      return;
    }

    if (!addressText.trim() && !landmark.trim()) {
      setError("Add a landmark or address.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("wardId", wardId);
      if (location) {
        formData.append("latitude", String(location.latitude));
        formData.append("longitude", String(location.longitude));
      }
      formData.append("addressText", addressText);
      formData.append("landmark", landmark);
      formData.append("description", "");
      formData.append("severity", severity);
      formData.append("wasteType", wasteType);

      const response = await fetch("/api/reports/create", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { reportId?: string; error?: string };

      if (!response.ok || !payload.reportId) {
        throw new Error(payload.error ?? "Report submission failed.");
      }

      router.push(`/report/${payload.reportId}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Report submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-slate-100">
      <div className="absolute inset-0">
        <LazyBhubaneswarMap
          reports={reports}
          wards={wards}
          height="100%"
          muted
          interactive={false}
          className="pointer-events-none blur-[1.5px]"
        />
        <div className="absolute inset-0 bg-white/52" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100svh-72px)] items-center justify-center px-3 py-5">
        <section className="max-h-[calc(100svh-96px)] w-full max-w-[520px] overflow-y-auto rounded-md border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.22)]">
          <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-slate-300" />
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h1 className="text-lg font-black text-slate-900">Report Garbage</h1>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close report form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-5 py-5">
            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Photo <span className="text-[#e60023]">*</span>
              </div>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:bg-slate-100">
                {photoPreview ? (
                  <img src={photoPreview} alt="Selected garbage report" className="h-40 w-full rounded-md object-cover" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-slate-400" />
                    <span className="mt-3 text-sm font-black text-slate-700">Take Photo</span>
                    <span className="mt-1 text-xs text-slate-400">A clear photo makes the report credible</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(event) => void handlePhotoChange(event.target.files?.[0] ?? null)}
                />
              </label>
              {photoPreview ? (
                <button
                  type="button"
                  onClick={() => {
                    if (photoPreview) URL.revokeObjectURL(photoPreview);
                    setPhoto(null);
                    setPhotoPreview(null);
                  }}
                  className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#e60023]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retake or choose another
                </button>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Ward <span className="text-[#e60023]">*</span>
              </label>
              <Select
                value={wardId}
                onChange={(event) => setWardId(event.target.value)}
                className="h-11 rounded-md border-slate-200 text-sm"
                aria-label="Select Bhubaneswar ward"
              >
                <option value="">Select Ward...</option>
                {wardOptions.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.label}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => void handleCurrentLocation()}
                disabled={loadingLocation}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#5b21ff] disabled:opacity-60"
              >
                {loadingLocation ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                {loadingLocation ? "Locating..." : "Use my current location"}
              </button>
              {location ? (
                <div className="mt-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  GPS locked - {Math.round(location.accuracy)} m accuracy
                </div>
              ) : null}
              {politicalLookup ? (
                <div className="mt-3">
                  <PoliticalRepresentativeSummary result={politicalLookup} compact />
                </div>
              ) : null}
              {politicalLookupError ? (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                  {politicalLookupError}
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Landmark / Address <span className="text-[#e60023]">*</span>
              </label>
              <Input
                value={addressText}
                onChange={(event) => setAddressText(event.target.value)}
                placeholder="e.g. Near Nayapalli market gate"
                className="rounded-md"
                aria-label="Landmark or address"
              />
              <Input
                value={landmark}
                onChange={(event) => setLandmark(event.target.value)}
                placeholder="Optional short landmark"
                className="mt-2 rounded-md"
                aria-label="Optional landmark"
              />
            </div>

            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                How bad is it?
              </div>
              <div className="grid gap-2">
                {reportSeverities.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSeverity(item)}
                    className={cn(
                      "grid grid-cols-[14px_1fr] gap-3 rounded-md border px-3 py-3 text-left transition",
                      severity === item ? "border-[#ff5a00] bg-[#fff7ed]" : "border-slate-200 bg-white hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 h-3 w-3 rounded-full",
                        item === "minor" && "bg-yellow-200",
                        item === "moderate" && "bg-orange-500",
                        item === "severe" && "bg-rose-300",
                        item === "critical" && "bg-red-400",
                      )}
                    />
                    <span>
                      <span className="block text-sm font-black text-slate-800">{severityLabels[item]}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-400">{severityDescriptions[item]}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Waste type
              </div>
              <div className="flex flex-wrap gap-2">
                {wasteTypeKeys.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setWasteType(item)}
                    className={cn(
                      "h-9 rounded-md border px-3 text-xs font-black transition",
                      wasteType === item
                        ? "border-[#5b21ff] bg-[#f3efff] text-[#5b21ff]"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                    )}
                  >
                    {wasteTypeLabels[item]}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold leading-5 text-rose-800">
                {error}
              </div>
            ) : null}

            <Button
              onClick={submitReport}
              disabled={submitting}
              className="h-11 w-full rounded-md bg-[#e60023] text-sm font-black hover:bg-[#c9001f]"
            >
              {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
