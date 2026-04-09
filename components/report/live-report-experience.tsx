/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CameraOff,
  Crosshair,
  ImagePlus,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";

import { LazyReportsMap } from "@/components/maps/lazy-reports-map";
import { RepresentativeCard } from "@/components/report/representative-card";
import { StatusBadge } from "@/components/report/status-badge";
import { TrustScoreBadge } from "@/components/report/trust-score-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { readApiResponse } from "@/lib/utils/api-client";
import { AppError } from "@/lib/utils/errors";
import type { AnalyzeReportResult, SourceType } from "@/types/domain";

type LocationState = {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
};

const sourceOptions: Array<{ label: string; value: SourceType; helper: string }> = [
  {
    label: "Live Capture",
    value: "LIVE_CAPTURE",
    helper: "Highest trust path using live camera evidence.",
  },
  {
    label: "Gallery Upload",
    value: "GALLERY_UPLOAD",
    helper: "Fallback path with lower default trust and stronger review.",
  },
];

function getErrorMessage(error: unknown) {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export function LiveReportExperience() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [sourceType, setSourceType] = useState<SourceType>("LIVE_CAPTURE");
  const [cameraReady, setCameraReady] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [captureTimestamp, setCaptureTimestamp] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<LocationState | null>(null);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeReportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  async function startCamera() {
    setCaptureError(null);

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch (error) {
      setCameraReady(false);
      setCaptureError(getErrorMessage(error));
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }

  async function captureFromCamera() {
    if (!videoRef.current) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const context = canvas.getContext("2d");
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));

    if (!blob) {
      setActionError("Could not capture image from the live camera.");
      return;
    }

    setCapturedFile(new File([blob], `live-capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
    stopCamera();
  }

  function setCapturedFile(file: File) {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setCaptureTimestamp(new Date().toISOString());
    setAnalysis(null);
    setActionError(null);
  }

  function resetCapture() {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(null);
    setImagePreviewUrl(null);
    setCaptureTimestamp(null);
    setAnalysis(null);
    setActionError(null);
    if (sourceType === "LIVE_CAPTURE") {
      void startCamera();
    }
  }

  async function requestLocation() {
    setActionError(null);
    if (!navigator.geolocation) {
      setActionError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        });
      },
      (error) => {
        setActionError(error.message || "Unable to access location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  async function analyzeCapture() {
    if (!imageFile || !locationState || !captureTimestamp) {
      setActionError("Please capture an image and allow location access first.");
      return;
    }

    setAnalyzing(true);
    setActionError(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("latitude", String(locationState.latitude));
      formData.append("longitude", String(locationState.longitude));
      formData.append("gpsAccuracyMeters", String(locationState.accuracy));
      formData.append("captureTimestamp", captureTimestamp);
      formData.append("description", description);
      formData.append("sourceType", sourceType);

      const response = await fetch("/api/reports/analyze", {
        method: "POST",
        body: formData,
      });

      const payload = await readApiResponse<AnalyzeReportResult & { error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      setAnalysis(payload as AnalyzeReportResult);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setAnalyzing(false);
    }
  }

  async function submitReport() {
    if (!analysis) {
      setActionError("Please analyze the captured image before submission.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const response = await fetch("/api/reports/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          previewToken: analysis.previewToken,
          description,
          anonymousFlag: anonymous,
        }),
      });

      const payload = await readApiResponse<{
        error?: string;
        report: {
          report: {
            id: string;
          };
        };
      }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not submit report.");
      }

      router.push(`/reports/${payload.report.report.id}`);
      router.refresh();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <Card className="space-y-6 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="section-label">Capture</span>
            <p className="text-sm text-slateblue-600">Live camera is the default trust-first path.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {sourceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSourceType(option.value);
                  setAnalysis(null);
                  setCaptureError(null);
                }}
                className={`rounded-[1.5rem] border p-4 text-left transition ${
                  sourceType === option.value
                    ? "border-civic-300 bg-civic-50"
                    : "border-slateblue-100 bg-white"
                }`}
              >
                <div className="font-semibold text-ink">{option.label}</div>
                <div className="mt-2 text-sm text-slateblue-600">{option.helper}</div>
              </button>
            ))}
          </div>

          {sourceType === "LIVE_CAPTURE" ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-slateblue-100 bg-slateblue-950">
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Captured report"
                    className="h-[340px] w-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className="h-[340px] w-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {!cameraReady && !imagePreviewUrl ? (
                  <Button onClick={() => void startCamera()}>
                    <Camera className="mr-2 h-4 w-4" />
                    Start camera
                  </Button>
                ) : null}
                {cameraReady && !imagePreviewUrl ? (
                  <Button onClick={() => void captureFromCamera()}>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture now
                  </Button>
                ) : null}
                {imagePreviewUrl ? (
                  <Button variant="secondary" onClick={resetCapture}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                ) : null}
                {cameraReady ? (
                  <Button variant="subtle" onClick={stopCamera}>
                    <CameraOff className="mr-2 h-4 w-4" />
                    Stop camera
                  </Button>
                ) : null}
              </div>
              {captureError ? <p className="text-sm text-rose-600">{captureError}</p> : null}
            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-civic-200 bg-civic-50/60 px-6 py-12 text-center">
                <ImagePlus className="h-8 w-8 text-civic-700" />
                <span className="mt-4 text-base font-semibold text-ink">
                  Upload a gallery image
                </span>
                <span className="mt-2 text-sm text-slateblue-600">
                  Gallery uploads are accepted, but they receive lower default trust.
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setCapturedFile(file);
                    }
                  }}
                />
              </label>
              {imagePreviewUrl ? (
                <div className="space-y-3">
                  <img
                    src={imagePreviewUrl}
                    alt="Selected upload"
                    className="h-[280px] w-full rounded-[1.5rem] border border-slateblue-100 object-cover"
                  />
                  <Button variant="secondary" onClick={resetCapture}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Choose another image
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </Card>

        <Card className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="section-label">Describe</span>
            <p className="text-sm text-slateblue-600">Add context for moderators and the public dashboard.</p>
          </div>
          <Textarea
            placeholder="Example: Garbage heap blocking pedestrians beside the market entry gate. Not cleaned for 2 days."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="section-label">Location</span>
            <p className="text-sm text-slateblue-600">Exact routing comes from device GPS, not the image.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void requestLocation()}>
              <Crosshair className="mr-2 h-4 w-4" />
              Capture current GPS
            </Button>
            {locationState ? (
              <div className="rounded-full bg-civic-50 px-4 py-2 text-sm font-semibold text-civic-700">
                Accuracy {Math.round(locationState.accuracy)} m
              </div>
            ) : null}
          </div>
          {locationState ? (
            <div className="space-y-3 text-sm text-slateblue-700">
              <div className="rounded-[1.25rem] border border-civic-100 bg-civic-50 px-4 py-3">
                <div className="font-semibold text-ink">Captured coordinates</div>
                <div className="mt-1 font-mono text-xs tracking-wide">
                  {locationState.latitude.toFixed(6)}, {locationState.longitude.toFixed(6)}
                </div>
              </div>
              <LazyReportsMap
                height={250}
                markers={[
                  {
                    id: "capture-location",
                    latitude: locationState.latitude,
                    longitude: locationState.longitude,
                    title: "Captured GPS",
                    subtitle: `Accuracy ${Math.round(locationState.accuracy)} m`,
                  },
                ]}
              />
            </div>
          ) : (
            <p className="text-sm text-slateblue-600">
              GPS permission is required for Odisha constituency mapping.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void analyzeCapture()} disabled={analyzing || !imageFile || !locationState}>
              {analyzing ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze report
            </Button>
            <Button variant="subtle" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
              <Upload className="mr-2 h-4 w-4" />
              Review capture
            </Button>
          </div>
          {actionError ? <p className="text-sm text-rose-600">{actionError}</p> : null}
        </Card>

        {analysis ? (
          <div className="space-y-6">
            <Card className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={analysis.aiSummary.suspiciousFlag ? "REPORTED" : "VERIFIED"} />
                <TrustScoreBadge score={analysis.trustScore} />
                {analysis.aiSummary.suspiciousFlag ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Needs closer review
                  </div>
                ) : null}
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink">Preview before submission</h3>
                <p className="mt-2 text-sm leading-6 text-slateblue-700">
                  {analysis.address.formattedLabel}
                </p>
              </div>
              <div className="grid gap-3 text-sm text-slateblue-700">
                <div className="rounded-[1.25rem] border border-slateblue-100 bg-slateblue-50/70 px-4 py-3">
                  <div className="font-semibold text-ink">District</div>
                  <div>{analysis.district?.name ?? "Unknown"}</div>
                </div>
                <div className="rounded-[1.25rem] border border-slateblue-100 bg-slateblue-50/70 px-4 py-3">
                  <div className="font-semibold text-ink">Assembly constituency</div>
                  <div>{analysis.assemblyConstituency?.name ?? "Not mapped"}</div>
                </div>
                <div className="rounded-[1.25rem] border border-slateblue-100 bg-slateblue-50/70 px-4 py-3">
                  <div className="font-semibold text-ink">Parliament constituency</div>
                  <div>{analysis.parliamentConstituency?.name ?? "Not mapped"}</div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <RepresentativeCard
                  representative={analysis.mla}
                  constituencyName={analysis.assemblyConstituency?.name ?? null}
                />
                <RepresentativeCard
                  representative={analysis.mp}
                  constituencyName={analysis.parliamentConstituency?.name ?? null}
                />
              </div>
              <div className="rounded-[1.5rem] border border-civic-100 bg-civic-50/70 p-4 text-sm text-civic-800">
                <div className="font-semibold text-ink">AI verification summary</div>
                <div className="mt-2">
                  Detected issue: <strong>{analysis.aiSummary.issueType}</strong> with confidence{" "}
                  <strong>{Math.round(analysis.aiSummary.confidenceScore * 100)}%</strong>.
                </div>
                <div className="mt-2">
                  GPS-image consistency: <strong>{analysis.aiSummary.gpsImageConsistency}</strong>
                </div>
                <div className="mt-2">{analysis.aiSummary.moderationNotes}</div>
              </div>
              {analysis.reviewNotes.length > 0 ? (
                <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-800">
                  <div className="font-semibold text-amber-900">Review notes</div>
                  <ul className="mt-2 space-y-2">
                    {analysis.reviewNotes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <label className="flex items-center gap-3 rounded-[1.25rem] border border-slateblue-100 px-4 py-3 text-sm text-slateblue-700">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(event) => setAnonymous(event.target.checked)}
                  className="h-4 w-4 rounded border-slateblue-300 text-civic-600 focus:ring-civic-500"
                />
                Submit this report anonymously
              </label>
              <Button className="w-full" size="lg" onClick={() => void submitReport()} disabled={submitting}>
                {submitting ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-4 w-4" />
                )}
                Submit report
              </Button>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
