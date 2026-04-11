"use client";

import Link from "next/link";

import { SiteMark } from "@/components/branding/site-mark";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-IN">
      <body className="bg-[#f5fbfa] text-ink">
        <main className="container flex min-h-screen flex-col items-center justify-center gap-8 py-16 text-center">
          <SiteMark iconOnly />
          <div className="space-y-4">
            <div className="section-label">Temporary service issue</div>
            <h1 className="text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
              Namma Odia could not load this page.
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slateblue-700 md:text-base">
              A server-side dependency may be unavailable right now. The app can usually recover after
              a retry or a redeploy. If this continues, check the database, storage, and environment
              variables on the deployment.
            </p>
            <p className="mx-auto max-w-xl text-xs leading-6 text-slateblue-500">
              {error.message}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Link
              href="/report/new"
              className="inline-flex h-11 items-center justify-center rounded-full border border-civic-200 bg-white px-5 text-sm font-semibold text-civic-700"
            >
              Open report flow
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slateblue-200 bg-white px-5 text-sm font-semibold text-slateblue-700"
            >
              Open admin login
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
