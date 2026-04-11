"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareDelhiReportButton({
  title,
  text,
  url,
}: {
  title: string;
  text: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  }

  return (
    <Button type="button" variant="secondary" onClick={handleShare}>
      <Share2 className="mr-2 h-4 w-4" />
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
