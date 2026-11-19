import { jwtVerify, SignJWT } from "jose";

import type { SessionUser } from "@/server/types";

/**
 * Session token primitives.
 *
 * This module is intentionally free of `next/headers` and of any
 * server-only imports so it can also run in the Edge middleware runtime.
 */

const DEV_SECRET = "portfolio-development-secret-not-for-production";

export const SESSION_COOKIE_NAME = "pa_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionClaims {
  id: string;
  email: string;
  role: "owner";
  tokenVersion: number;
}

function rawSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  return process.env.NODE_ENV === "production" ? "" : DEV_SECRET;
}

function secretKey(): Uint8Array {
  const secret = rawSecret();
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not configured. Add it to your environment before enabling admin access.",
    );
  }
  return new TextEncoder().encode(secret);
}

export function isSessionSecretConfigured(): boolean {
  return Boolean(rawSecret());
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({
    email: claims.email,
    role: claims.role,
    ver: claims.tokenVersion,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.id)
    .setIssuedAt()
    .setIssuer("portfolio-platform")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionClaims | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "portfolio-platform",
    });

    const email = typeof payload.email === "string" ? payload.email : "";
    const role = payload.role === "owner" ? "owner" : "owner";
    const tokenVersion = typeof payload.ver === "number" ? payload.ver : 0;
    const id = typeof payload.sub === "string" ? payload.sub : "";

    if (!email || !id) return null;

    return { id, email, role, tokenVersion };
  } catch {
    return null;
  }
}

export function toSessionUser(claims: SessionClaims): SessionUser {
  return {
    id: claims.id,
    email: claims.email,
    role: claims.role,
    tokenVersion: claims.tokenVersion,
  };
}
