"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

function getSessionKey() {
  if (typeof window === "undefined") {
    return "server";
  }

  const existing = window.localStorage.getItem("safa-support-session");
  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  window.localStorage.setItem("safa-support-session", next);
  return next;
}

export function SupportButton({ reportId, initialCount }: { reportId: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [submitting, setSubmitting] = useState(false);
  const [sessionKey, setSessionKey] = useState<string>("");

  useEffect(() => {
    setSessionKey(getSessionKey());
  }, []);

  async function support() {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionKey }),
      });
      const payload = await response.json();
      if (response.ok) {
        setCount(payload.count);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button variant="secondary" onClick={() => void support()} disabled={submitting || !sessionKey}>
      Support complaint ({count})
    </Button>
  );
}
