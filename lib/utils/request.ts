import type { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { sha256 } from "@/lib/utils/hash";

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "127.0.0.1";
  }

  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

export function getSessionFingerprint(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  return sha256(`${ip}:${userAgent}`);
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return;
  }

  const allowedOrigins = new Set(
    [env.NEXT_PUBLIC_APP_URL, request.nextUrl.origin]
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[],
  );

  if (!allowedOrigins.has(origin)) {
    throw new Error("Origin mismatch.");
  }
}
