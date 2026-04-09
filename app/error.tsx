"use client";

import Link from "next/link";

import { SafaOdishaLogo } from "@/components/branding/safa-odisha-logo";
import { Button } from "@/components/ui/button";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container flex min-h-[70vh] flex-col items-center justify-center gap-7 py-16 text-center">
      <SafaOdishaLogo iconOnly />
      <div className="space-y-4">
        <div className="section-label">Something broke</div>
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">
          The page could not finish loading.
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-6 text-slateblue-700">{error.message}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border border-slateblue-200 bg-white px-5 text-sm font-semibold text-slateblue-700"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
