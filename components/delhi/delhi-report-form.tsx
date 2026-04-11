/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, LoaderCircle, LocateFixed, RotateCcw } from "lucide-react";

import { AccountabilityCard } from "@/components/delhi/accountability-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  delhiSeverities,
  delhiWasteTypes,
  severityDescriptions,
  severityLabels,
  wasteTypeLabels,
} from "@/lib/delhi/constants";
import type { DelhiJurisdictionLookup, DelhiSeverity, DelhiWasteType } from "@/lib/delhi/types";

type LocationState = {
  latitude: number;
  longitude: number;
  accuracy: number;
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

export function DelhiReportForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationState | null>(null);
  const [jurisdiction, setJurisdiction] = useState<DelhiJurisdictionLookup | null>(null);
  const [addressText, setAddressText] = useState("");
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<DelhiSeverity>("moderate");
  const [wasteType, setWasteType] = useState<DelhiWasteType>("mixed_waste");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  async function handlePhotoChange(file: File | null) {
    setError(null);

    if (!file) {
      return;
    }

    const compressed = await compressImage(file);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhoto(compressed);
    setPhotoPreview(URL.createObjectURL(compressed));
  }

  async function lookupLocation(latitude: number, longitude: number) {
    const [reverseResponse, jurisdictionResponse] = await Promise.all([
      fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`),
      fetch(`/api/jurisdictions/lookup?lat=${latitude}&lng=${longitude}`),
    ]);

    if (reverseResponse.ok) {
      const reverse = (await reverseResponse.json()) as { addressLine?: string; formattedLabel?: string };
      setAddressText((current) => current || reverse.addressLine || reverse.formattedLabel || "");
    }

    const jurisdictionPayload = (await jurisdictionResponse.json()) as DelhiJurisdictionLookup & { error?: string };
    if (!jurisdictionResponse.ok) {
      throw new Error(jurisdictionPayload.error ?? "Could not resolve Delhi jurisdiction.");
    }

    setJurisdiction(jurisdictionPayload);
  }

  async function useCurrentLocation() {
    setError(null);
    setLoadingLocation(true);

    if (!navigator.geolocation) {
      setError("This browser does not support geolocation.");
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
      setError("Take or upload a garbage photo first.");
      return;
    }

    if (!location) {
      setError("Use your current location before submitting.");
      return;
    }

    if (!addressText.trim()) {
      setError("Add a landmark or address before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("latitude", String(location.latitude));
      formData.append("longitude", String(location.longitude));
      formData.append("addressText", addressText);
      formData.append("landmark", landmark);
      formData.append("description", description);
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
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="space-y-5 p-5">
        <div>
          <h2 className="text-xl font-black text-ink">1. Photo evidence</h2>
          <p className="mt-1 text-sm leading-6 text-slateblue-700">
            On mobile, this uses the rear camera first. You can also upload an existing image.
          </p>
        </div>
        <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-civic-200 bg-civic-50/70 p-4 text-center transition hover:bg-civic-50">
          {photoPreview ? (
            <img src={photoPreview} alt="Selected garbage report" className="h-64 w-full rounded-[1.25rem] object-cover" />
          ) : (
            <>
              <Camera className="h-10 w-10 text-civic-700" />
              <span className="mt-3 font-bold text-ink">Take a Photo</span>
              <span className="mt-1 text-sm text-slateblue-600">or upload instead</span>
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
            className="inline-flex items-center gap-2 text-sm font-semibold text-civic-700"
          >
            <RotateCcw className="h-4 w-4" />
            Retake or choose another photo
          </button>
        ) : null}
      </Card>

      <Card className="space-y-5 p-5">
        <div>
          <h2 className="text-xl font-black text-ink">2. Location and details</h2>
          <p className="mt-1 text-sm leading-6 text-slateblue-700">
            GPS lookup maps the report to Delhi civic authority, ward or equivalent, MLA, and MP.
          </p>
        </div>

        <Button onClick={useCurrentLocation} disabled={loadingLocation}>
          {loadingLocation ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
          {loadingLocation ? "Locating..." : "Use my current location"}
        </Button>

        {location ? (
          <div className="rounded-2xl border border-slateblue-100 bg-slateblue-50/60 px-4 py-3 text-sm text-slateblue-700">
            Captured {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)} with about{" "}
            {Math.round(location.accuracy)} m accuracy.
          </div>
        ) : null}

        <Input
          value={addressText}
          onChange={(event) => setAddressText(event.target.value)}
          placeholder="Landmark / Address"
          aria-label="Landmark or address"
        />
        <Input
          value={landmark}
          onChange={(event) => setLandmark(event.target.value)}
          placeholder="Optional landmark, e.g. near market gate"
          aria-label="Optional landmark"
        />
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional note, e.g. recurring dump, road blocked, smell, animals"
          aria-label="Optional report note"
        />
      </Card>

      <Card className="space-y-5 p-5 lg:col-span-2">
        <div>
          <h2 className="text-xl font-black text-ink">3. Severity and waste type</h2>
          <p className="mt-1 text-sm leading-6 text-slateblue-700">
            Choose the best match. Moderators can correct categories later if needed.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {delhiSeverities.map((item) => (
            <label
              key={item}
              className={`cursor-pointer rounded-[1.4rem] border p-4 transition ${
                severity === item ? "border-civic-400 bg-civic-50" : "border-slateblue-100 bg-white"
              }`}
            >
              <input
                type="radio"
                name="severity"
                value={item}
                checked={severity === item}
                onChange={() => setSeverity(item)}
                className="sr-only"
              />
              <span className="font-black text-ink">{severityLabels[item]}</span>
              <span className="mt-2 block text-sm leading-6 text-slateblue-700">{severityDescriptions[item]}</span>
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {delhiWasteTypes.map((item) => (
            <label
              key={item}
              className={`cursor-pointer rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                wasteType === item ? "border-saffron-300 bg-saffron-50 text-saffron-900" : "border-slateblue-100 bg-white text-slateblue-700"
              }`}
            >
              <input
                type="radio"
                name="wasteType"
                value={item}
                checked={wasteType === item}
                onChange={() => setWasteType(item)}
                className="sr-only"
              />
              {wasteTypeLabels[item]}
            </label>
          ))}
        </div>
      </Card>

      <Card className="space-y-5 p-5 lg:col-span-2">
        <div>
          <h2 className="text-xl font-black text-ink">4. Jurisdiction preview</h2>
          <p className="mt-1 text-sm leading-6 text-slateblue-700">
            This is filled after GPS lookup. If PostGIS is not available yet, the lookup will show a setup error.
          </p>
        </div>

        {jurisdiction ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <AccountabilityCard
              title="Civic Body"
              name={jurisdiction.authority?.name ?? "Not matched"}
              subtitle={jurisdiction.authority?.type}
            />
            <AccountabilityCard
              title="Ward or Local Unit"
              name={jurisdiction.ward?.number ? `Ward ${jurisdiction.ward.number}` : "Not matched"}
              subtitle={jurisdiction.ward?.name}
            />
            <AccountabilityCard
              title="MLA"
              name={jurisdiction.mla?.name ?? "Not matched"}
              subtitle={jurisdiction.assembly?.name}
              partyName={jurisdiction.mla?.partyName}
              partyShortName={jurisdiction.mla?.partyShortName}
              partyLogoUrl={jurisdiction.mla?.partyLogoUrl}
            />
            <AccountabilityCard
              title="MP"
              name={jurisdiction.mp?.name ?? "Not matched"}
              subtitle={jurisdiction.parliament?.name}
              partyName={jurisdiction.mp?.partyName}
              partyShortName={jurisdiction.mp?.partyShortName}
              partyLogoUrl={jurisdiction.mp?.partyLogoUrl}
            />
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slateblue-200 bg-slateblue-50/60 p-5 text-sm leading-6 text-slateblue-700">
            Use your current location to preview the civic body, ward, MLA, and MP.
          </div>
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button onClick={submitReport} disabled={submitting}>
            {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
          <Button variant="secondary" onClick={() => router.push("/")}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
