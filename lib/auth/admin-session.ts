import "server-only";

import { cookies } from "next/headers";
import { type JWTPayload, SignJWT, jwtVerify } from "jose";

import { env } from "@/lib/env";
import { AppError } from "@/lib/utils/errors";

const sessionCookieName = "safa-admin-session";
const secret = new TextEncoder().encode(env.ADMIN_SESSION_SECRET);

export interface AdminSessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "MODERATOR";
}

export async function createAdminSession(payload: AdminSessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<AdminSessionPayload>(token, secret);
    return verified.payload;
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    throw new AppError("Admin authentication required.", 401);
  }

  return session;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}
