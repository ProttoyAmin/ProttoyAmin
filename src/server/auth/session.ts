import "server-only";

import { cookies } from "next/headers";

import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSessionToken,
  toSessionUser,
  verifySessionToken,
  type SessionClaims,
} from "@/server/auth/token";
import type { AdminUser, SessionUser } from "@/server/types";

/** Reads the session cookie and verifies its signature. */
export async function readSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const claims = await readSession();
  return claims ? toSessionUser(claims) : null;
}

export async function createSession(user: AdminUser): Promise<void> {
  const token = await signSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
