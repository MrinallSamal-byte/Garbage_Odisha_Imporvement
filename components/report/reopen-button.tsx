"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { readApiResponse } from "@/lib/utils/api-client";

function getSessionKey() {
  if (typeof window === "undefined") return "server";
  const key = window.localStorage.getItem("safa-support-session");
  if (key) return key;
  const next = crypto.randomUUID();
  window.localStorage.setItem("safa-support-session", next);
  return next;
}

export function ReopenButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReopen() {
    if (reason.trim().length < 10) {
      setError("Please describe why the issue is still unresolved (at least 10 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionKey: getSessionKey(), reason: reason.trim() }),
      });
      const payload = await readApiResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(payload.error ?? "Could not reopen report.");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reopen report.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
        ✓ Report re-opened. Moderators will review your update.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-amber-100 bg-amber-50/60 p-4">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between text-sm font-semibold text-amber-700"
      >
        <span className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Issue still unresolved? Re-open this report
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="space-y-3 pt-1">
          <p className="text-xs leading-5 text-amber-600">
            If the issue has not actually been fixed, describe what you still see. This will
            change the status back to Reported and notify moderators. Use the same browser session
            that supported this complaint.
          </p>
          <Textarea
            placeholder="e.g. The garbage is still here — no cleanup has happened since the report was marked resolved."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px] border-amber-200 bg-white focus:border-amber-400 focus:ring-amber-100"
          />
          <Button
            onClick={() => void handleReopen()}
            disabled={submitting}
            variant="secondary"
            className="border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
          >
            {submitting ? "Submitting…" : "Re-open report"}
          </Button>
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
