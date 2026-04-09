"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ModerationStatus, ReportStatus } from "@/types/domain";

const reportStatuses: ReportStatus[] = [
  "REPORTED",
  "VERIFIED",
  "FORWARDED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "DUPLICATE",
];

const moderationStatuses: ModerationStatus[] = ["PENDING", "APPROVED", "REJECTED", "NEEDS_REVIEW"];

export function AdminReportActions({
  reportId,
  initialStatus,
  initialModeration,
}: {
  reportId: string;
  initialStatus: ReportStatus;
  initialModeration: ModerationStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>(initialStatus);
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>(initialModeration);
  const [note, setNote] = useState("Reviewed by admin.");
  const [reason, setReason] = useState("Moderation updated by admin.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update status.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setLoading(false);
    }
  }

  async function updateModeration() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moderationStatus, reason }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update moderation.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update moderation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-slateblue-100 bg-slateblue-50/70 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Select value={status} onChange={(event) => setStatus(event.target.value as ReportStatus)}>
            {reportStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-[100px]" />
          <Button variant="secondary" onClick={() => void updateStatus()} disabled={loading}>
            Save status
          </Button>
        </div>
        <div className="space-y-2">
          <Select
            value={moderationStatus}
            onChange={(event) => setModerationStatus(event.target.value as ModerationStatus)}
          >
            {moderationStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-[100px]" />
          <Button onClick={() => void updateModeration()} disabled={loading}>
            Save moderation
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
