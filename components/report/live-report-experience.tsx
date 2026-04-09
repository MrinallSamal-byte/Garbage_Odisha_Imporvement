/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CameraOff,
  Check,
  CheckCircle2,
  Crosshair,
  ImagePlus,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { LazyReportsMap } from "@/components/maps/lazy-reports-map";
import { RepresentativeCard } from "@/components/report/representative-card";
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

type Step = "capture" | "locate" | "review" | "done";

const STEPS: { id: Step; label: string; description: string }[] = [
  { id: "capture", label: "Capture", description: "Take a live photo or upload from gallery" },
  { id: "locate", label: "Locate", description: "Allow GPS for exact constituency mapping" },
  { id: "review", label: "Review", description: "AI analysis + representative lookup" },
  { id: "done", label: "Submit", description: "Confirm and publish to the dashboard" },
];

function getErrorMessage(error: unknown) {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                    done
                      ? "border-civic-500 bg-civic-500 text-white"
                      : active
                        ? "border-ink bg-ink text-white shadow-[0_0_0_4px_rgba(22,50,79,0.12)]"
                        : "border-slateblue-200 bg-white text-slateblue-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={`hidden text-[10px] font-semibold uppercase tracking-[0.16em] sm:block ${
                    active ? "text-ink" : done ? "text-civic-600" : "text-slateblue-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 transition-all duration-500 ${
                    index < currentIndex ? "bg-civic-400" : "bg-slateblue-100"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-center text-sm text-slateblue-600">
        {STEPS[currentIndex]?.description}
      </p>
    </div>
  );
}

function AnalyzingOverlay() {
  const messages = [
    "Scanning image for issues…",
    "Verifying GPS coordinates…",
    "Mapping to constituency…",
    "Looking up representatives…",
    "Computing trust score…",
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-4 rounded-[1.75rem] border border-civic-100 bg-civic-50/80 px-6 py-10 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <LoaderCircle className="h-14 w-14 animate-spin text-civic-300" />
        <Sparkles className="absolute h-6 w-6 text-civic-600" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-ink">Analyzing your report</p>
        <p className="h-5 text-sm text-slateblue-600 transition-all">{messages[msgIndex]}</p>
      </div>
    </div>
  );
}

export function LiveReportExperience() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [step, setStep] = useState<Step>("capture");
  const [sourceType, setSourceType] = useState<SourceType>("LIVE_CAPTURE");
  const [cameraReady, setCameraReady] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [captureTimestamp, setCaptureTimestamp] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<LocationState | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeReportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  async function startCamera() {
    setCaptureError(null);
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
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
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }

  async function captureFromCamera() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.92));
    if (!blob) {
      setActionError("Could not capture image.");
      return;
    }
    setCapturedFile(new File([blob], `live-${Date.now()}.jpg`, { type: "image/jpeg" }));
    stopCamera();
  }

  function setCapturedFile(file: File) {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setCaptureTimestamp(new Date().toISOString());
    setAnalysis(null);
    setActionError(null);
    setStep("locate");
  }

  function resetCapture() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    setCaptureTimestamp(null);
    setAnalysis(null);
    setActionError(null);
    setStep("capture");
    if (sourceType === "LIVE_CAPTURE") void startCamera();
  }

  async function requestLocation() {
    setActionError(null);
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setActionError("Geolocation not supported in this browser.");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: new Date(pos.timestamp).toISOString(),
        });
        setLocationLoading(false);
        setStep("review");
      },
      (err) => {
        setActionError(err.message || "Unable to access location.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  async function analyzeCapture() {
    if (!imageFile || !locationState || !captureTimestamp) {
      setActionError("Capture an image and allow GPS access first.");
      return;
    }
    setAnalyzing(true);
    setActionError(null);
    try {
      const form = new FormData();
      form.append("image", imageFile);
      form.append("latitude", String(locationState.latitude));
      form.append("longitude", String(locationState.longitude));
      form.append("gpsAccuracyMeters", String(locationState.accuracy));
      form.append("captureTimestamp", captureTimestamp);
      form.append("description", description);
      form.append("sourceType", sourceType);
      const res = await fetch("/api/reports/analyze", { method: "POST", body: form });
      const payload = await readApiResponse<AnalyzeReportResult & { error?: string }>(res);
      if (!res.ok) throw new Error(payload.error ?? "Analysis failed.");
      setAnalysis(payload as AnalyzeReportResult);
      setStep("done");
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setAnalyzing(false);
    }
  }

  async function submitReport() {
    if (!analysis) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/reports/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewToken: analysis.previewToken,
          description,
          anonymousFlag: anonymous,
        }),
      });
      const payload = await readApiResponse<{ error?: string; report: { report: { id: string } } }>(res);
      if (!res.ok) throw new Error(payload.error ?? "Submission failed.");
      router.push(`/reports/${payload.report.report.id}`);
      router.refresh();
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator current={step} />

      <div className="space-y-5">
        {/* ── Step 1: Capture ─────────────────────────────────────────────── */}
        {step === "capture" && (
          <Card className="space-y-5 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {(["LIVE_CAPTURE", "GALLERY_UPLOAD"] as SourceType[]).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setSourceType(val);
                    setAnalysis(null);
                    setCaptureError(null);
                  }}
                  className={`rounded-[1.5rem] border p-4 text-left transition ${
                    sourceType === val
                      ? "border-ink bg-ink/5 ring-2 ring-ink/10"
                      : "border-slateblue-100 bg-white hover:border-slateblue-200"
                  }`}
                >
                  <div className="font-semibold text-ink">
                    {val === "LIVE_CAPTURE" ? "📷 Live Capture" : "🖼 Gallery Upload"}
                  </div>
                  <div className="mt-1.5 text-sm text-slateblue-600">
                    {val === "LIVE_CAPTURE"
                      ? "Highest trust — photo taken in real time."
                      : "Fallback — lower default trust score."}
                  </div>
                </button>
              ))}
            </div>

            {sourceType === "LIVE_CAPTURE" ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-[1.75rem] border border-slateblue-100 bg-black">
                  <video
                    ref={videoRef}
                    className="h-[300px] w-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  {!cameraReady && (
                    <Button onClick={() => void startCamera()}>
                      <Camera className="mr-2 h-4 w-4" />
                      Start camera
                    </Button>
                  )}
                  {cameraReady && (
                    <>
                      <Button onClick={() => void captureFromCamera()}>
                        <Camera className="mr-2 h-4 w-4" />
                        Capture
                      </Button>
                      <Button variant="subtle" onClick={stopCamera}>
                        <CameraOff className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
                {captureError && (
                  <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{captureError}</p>
                )}
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-civic-200 bg-civic-50/60 px-6 py-12 text-center transition hover:bg-civic-50">
                <ImagePlus className="h-10 w-10 text-civic-600" />
                <span className="mt-3 text-base font-semibold text-ink">Choose from gallery</span>
                <span className="mt-1 text-sm text-slateblue-500">JPEG, PNG, or WebP</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCapturedFile(file);
                  }}
                />
              </label>
            )}
          </Card>
        )}

        {/* ── Step 2: Locate ──────────────────────────────────────────────── */}
        {step === "locate" && imagePreviewUrl && (
          <div className="space-y-4">
            <Card className="overflow-hidden p-0">
              <img
                src={imagePreviewUrl}
                alt="Captured"
                className="h-[220px] w-full object-cover"
              />
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-semibold text-civic-700">✓ Image captured</span>
                <button
                  onClick={resetCapture}
                  className="text-xs text-slateblue-500 underline underline-offset-2 hover:text-ink"
                >
                  Retake
                </button>
              </div>
            </Card>

            <Card className="space-y-4 p-5">
              <div>
                <h2 className="text-lg font-bold text-ink">Allow GPS access</h2>
                <p className="mt-1 text-sm text-slateblue-600">
                  Constituency routing uses device GPS — not the image itself.
                </p>
              </div>
              <Button
                onClick={() => void requestLocation()}
                disabled={locationLoading}
                size="lg"
                className="w-full"
              >
                {locationLoading ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="mr-2 h-4 w-4" />
                )}
                {locationLoading ? "Getting location…" : "Capture current GPS"}
              </Button>
              {locationState && (
                <div className="rounded-[1.25rem] border border-civic-100 bg-civic-50 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-civic-700">
                    <CheckCircle2 className="h-4 w-4" />
                    GPS locked — accuracy {Math.round(locationState.accuracy)} m
                  </div>
                  <div className="mt-1 font-mono text-xs text-slateblue-600">
                    {locationState.latitude.toFixed(6)}, {locationState.longitude.toFixed(6)}
                  </div>
                </div>
              )}
              {actionError && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</p>
              )}
            </Card>
          </div>
        )}

        {/* ── Step 3: Review (analyze) ────────────────────────────────────── */}
        {step === "review" && (
          <div className="space-y-4">
            {imagePreviewUrl && locationState && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Card className="overflow-hidden p-0">
                  <img
                    src={imagePreviewUrl}
                    alt="Captured"
                    className="h-[160px] w-full object-cover"
                  />
                  <p className="px-4 py-2 text-xs font-semibold text-civic-700">✓ Image ready</p>
                </Card>
                <Card className="flex flex-col justify-between p-4">
                  <div className="text-xs font-semibold text-civic-700">✓ GPS locked</div>
                  <div className="mt-1 font-mono text-xs text-slateblue-600">
                    {locationState.latitude.toFixed(5)}, {locationState.longitude.toFixed(5)}
                  </div>
                  <div className="mt-2 text-xs text-slateblue-500">
                    Accuracy: {Math.round(locationState.accuracy)} m
                  </div>
                  <LazyReportsMap
                    height={80}
                    markers={[{
                      id: "loc",
                      latitude: locationState.latitude,
                      longitude: locationState.longitude,
                      title: "Your location",
                      subtitle: "",
                    }]}
                  />
                </Card>
              </div>
            )}

            <Card className="space-y-4 p-5">
              <div>
                <label className="block text-sm font-semibold text-ink">
                  Describe the issue <span className="font-normal text-slateblue-500">(optional)</span>
                </label>
                <Textarea
                  className="mt-2"
                  placeholder="e.g. Garbage heap blocking the market gate, not cleaned for 2 days."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {analyzing ? (
                <AnalyzingOverlay />
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => void analyzeCapture()}
                  disabled={analyzing}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze &amp; map report
                </Button>
              )}
              {actionError && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</p>
              )}
            </Card>
          </div>
        )}

        {/* ── Step 4: Submit ──────────────────────────────────────────────── */}
        {step === "done" && analysis && (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Analysis complete — review and submit below.
              </div>
            </div>

            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <TrustScoreBadge score={analysis.trustScore} />
                {analysis.aiSummary.suspiciousFlag && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Needs review
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-ink">Location resolved</h3>
                <p className="mt-1 text-sm text-slateblue-600">{analysis.address.formattedLabel}</p>
              </div>

              <div className="grid gap-2 text-sm">
                {[
                  { label: "District", value: analysis.district?.name },
                  { label: "Assembly", value: analysis.assemblyConstituency?.name },
                  { label: "Parliament", value: analysis.parliamentConstituency?.name },
                ].filter((r) => r.value).map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-2xl border border-slateblue-100 bg-slateblue-50/50 px-4 py-2.5">
                    <span className="font-semibold text-ink">{row.label}</span>
                    <span className="text-slateblue-700">{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {(analysis.mla || analysis.mp) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {analysis.mla && (
                  <RepresentativeCard
                    representative={analysis.mla}
                    constituencyName={analysis.assemblyConstituency?.name ?? null}
                  />
                )}
                {analysis.mp && (
                  <RepresentativeCard
                    representative={analysis.mp}
                    constituencyName={analysis.parliamentConstituency?.name ?? null}
                  />
                )}
              </div>
            )}

            <Card className="space-y-4 p-5">
              <div className="rounded-[1.25rem] border border-civic-100 bg-civic-50/70 p-4 text-sm text-civic-800">
                <p className="font-semibold text-ink">AI summary</p>
                <p className="mt-1">
                  Issue: <strong>{analysis.aiSummary.issueType}</strong> ·{" "}
                  Confidence: <strong>{Math.round(analysis.aiSummary.confidenceScore * 100)}%</strong> ·{" "}
                  GPS consistency: <strong>{analysis.aiSummary.gpsImageConsistency}</strong>
                </p>
                {analysis.aiSummary.moderationNotes && (
                  <p className="mt-1 text-slateblue-700">{analysis.aiSummary.moderationNotes}</p>
                )}
              </div>

              {analysis.reviewNotes.length > 0 && (
                <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-800">
                  <p className="font-semibold text-amber-900">Review notes</p>
                  <ul className="mt-1.5 space-y-1">
                    {analysis.reviewNotes.map((note) => (
                      <li key={note} className="flex items-start gap-1.5">
                        <span className="mt-0.5 text-amber-500">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slateblue-100 px-4 py-3 transition hover:bg-slateblue-50">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-slateblue-300 accent-civic-600"
                />
                <span className="text-sm text-slateblue-700">Submit anonymously</span>
              </label>

              <Button
                size="lg"
                className="w-full bg-[#d62828] shadow-[0_8px_24px_rgba(214,40,40,0.25)] hover:bg-[#b91c1c]"
                onClick={() => void submitReport()}
                disabled={submitting}
              >
                {submitting ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-4 w-4" />
                )}
                {submitting ? "Publishing…" : "Submit report"}
              </Button>

              {actionError && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</p>
              )}
            </Card>

            <button
              onClick={() => { setAnalysis(null); setStep("review"); }}
              className="w-full text-center text-sm text-slateblue-500 underline underline-offset-2"
            >
              <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
              Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
