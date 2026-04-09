"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f7fbfa]">
        <main className="container flex min-h-screen flex-col items-center justify-center gap-6 py-16 text-center">
          <div className="section-label">Something broke</div>
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">The page could not finish loading.</h1>
          <p className="max-w-xl text-sm leading-6 text-slateblue-700">{error.message}</p>
          <Button onClick={reset}>Try again</Button>
        </main>
      </body>
    </html>
  );
}
