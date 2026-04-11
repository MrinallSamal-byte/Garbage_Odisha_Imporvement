"use client";

import { useState } from "react";
import { UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ConfirmReportButton({
  reportId,
  initialCount,
}: {
  reportId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [status, setStatus] = useState<"idle" | "saving" | "confirmed" | "duplicate" | "error">("idle");

  async function handleConfirm() {
    setStatus("saving");

    try {
      const response = await fetch(`/api/reports/${reportId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as {
        reporterCount?: number;
        confirmed?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not confirm this report.");
      }

      setCount(data.reporterCount ?? count);
      setStatus(data.confirmed ? "confirmed" : "duplicate");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleConfirm} disabled={status === "saving"}>
        <UsersRound className="mr-2 h-4 w-4" />
        {status === "saving" ? "Confirming..." : "I have seen this too"}
      </Button>
      <p className="text-sm text-slateblue-600">
        {count} citizen confirmation{count === 1 ? "" : "s"}
        {status === "confirmed" ? " - your confirmation was added." : null}
        {status === "duplicate" ? " - you already confirmed this report." : null}
        {status === "error" ? " - confirmation failed. Try again." : null}
      </p>
    </div>
  );
}
