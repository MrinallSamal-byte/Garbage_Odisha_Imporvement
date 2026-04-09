"use client";

import { useState } from "react";
import { Share2, MessageCircle, Copy, Check } from "lucide-react";

export function ShareReportButton({
  reportCode,
  addressLine,
  reportUrl,
}: {
  reportCode: string;
  addressLine: string;
  reportUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareText = `SafaOdisha Report ${reportCode}: "${addressLine}" — Please take action on this public cleanliness issue.`;

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `SafaOdisha Report ${reportCode}`,
          text: shareText,
          url: reportUrl,
        });
      } catch {
        // user cancelled — silent
      }
      return;
    }
    setOpen((prev) => !prev);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(reportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${reportUrl}`)}`;

  return (
    <div className="relative">
      <button
        onClick={() => void handleNativeShare()}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-slateblue-100 bg-white px-4 text-sm font-semibold text-slateblue-700 transition hover:bg-slateblue-50"
      >
        <Share2 className="h-4 w-4" />
        Share this report
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-12 z-10 overflow-hidden rounded-[1.5rem] border border-slateblue-100 bg-white shadow-lg">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-50"
            onClick={() => setOpen(false)}
          >
            <MessageCircle className="h-4 w-4" />
            Share on WhatsApp
          </a>
          <button
            onClick={() => void handleCopy()}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-slateblue-700 transition hover:bg-slateblue-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Link copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
