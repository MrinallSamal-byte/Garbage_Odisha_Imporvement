"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CommentComposer({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${reportId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          body,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not post comment.");
      }

      setDisplayName("");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Your display name"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
      />
      <Textarea
        placeholder="Add a public comment or area update"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <Button onClick={() => void handleSubmit()} disabled={submitting}>
        Post comment
      </Button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
