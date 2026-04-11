import type { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { AppError } from "@/lib/utils/errors";
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

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function originFromHost(host: string | null, protocol: string | null) {
  if (!host || !protocol) {
    return null;
  }

  return normalizeOrigin(`${protocol.replace(/:$/, "")}://${host}`);
}

export function assertSameOrigin(request: NextRequest) {
  const origin = normalizeOrigin(request.headers.get("origin"));

  if (!origin) {
    return;
  }

  const forwardedProtocol = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = firstHeaderValue(request.headers.get("host"));
  const requestProtocol = request.nextUrl.protocol.replace(/:$/, "");

  const allowedOrigins = new Set(
    [
      normalizeOrigin(env.NEXT_PUBLIC_APP_URL),
      normalizeOrigin(request.nextUrl.origin),
      originFromHost(forwardedHost, forwardedProtocol ?? requestProtocol),
      originFromHost(host, forwardedProtocol ?? requestProtocol),
      originFromHost(host, requestProtocol),
    ]
      .filter(Boolean) as string[],
  );

  if (!allowedOrigins.has(origin)) {
    throw new AppError("Cross-origin request blocked.", 403);
  }
}
