import { NextResponse } from "next/server";

import { ensureOwnerUser } from "@/server/auth/bootstrap";
import { isSessionSecretConfigured } from "@/server/auth/token";
import { verifyPassword } from "@/server/auth/password";
import {
  clientIpFromHeaders,
  consumeRateLimit,
  resetRateLimit,
} from "@/server/auth/rate-limit";
import { createSession } from "@/server/auth/session";
import { getRepositories } from "@/server/db/registry";
import { recordAudit } from "@/server/services/audit.service";
import { loginInputSchema } from "@/lib/validation/content";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid credentials" },
      { status: 422 },
    );
  }

  // A missing session secret is a configuration problem, not a bad
  // password. Report it as such so the owner sees what to fix.
  if (!isSessionSecretConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin sign-in is disabled because SESSION_SECRET is not configured. Set it in the environment and restart the server.",
        code: "session_secret_missing",
      },
      { status: 503 },
    );
  }

  const { email, password } = parsed.data;
  const ip = clientIpFromHeaders(request.headers);
  const limit = consumeRateLimit(`login:${ip}:${email.toLowerCase()}`, MAX_ATTEMPTS, WINDOW_MS);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      },
      { status: 429 },
    );
  }

  try {
    await ensureOwnerUser();

    const repositories = await getRepositories();
    const user = await repositories.users.getByEmail(email.toLowerCase());

    // Always answer identically so the endpoint cannot enumerate accounts.
    const invalid = NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    if (!user) return invalid;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await repositories.users.update(user.id, {
        failedAttempts: (user.failedAttempts ?? 0) + 1,
      });
      return invalid;
    }

    resetRateLimit(`login:${ip}:${email.toLowerCase()}`);

    const updated = await repositories.users.update(user.id, {
      failedAttempts: 0,
      lastLoginAt: new Date().toISOString(),
    });

    await createSession(updated ?? user);
    await recordAudit({
      actorEmail: user.email,
      action: "login",
      entity: "users",
      entityId: user.id,
      ip,
    });

    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    console.error("[auth] login failed:", error);
    return NextResponse.json(
      { error: "Sign-in is unavailable right now. Please try again." },
      { status: 500 },
    );
  }
}
