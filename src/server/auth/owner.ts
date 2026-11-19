import "server-only";

import { getRepositories } from "@/server/db/registry";
import { ForbiddenError, UnauthorizedError } from "@/server/errors";
import { readSession } from "@/server/auth/session";
import type { AdminUser, SiteSettings } from "@/server/types";

export interface OwnerContext {
  user: AdminUser;
  settings: SiteSettings;
}

export interface OwnershipDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * The pure ownership rule, extracted so it can be unit tested without a
 * request context.
 *
 * A request is authorised only when the session email matches the configured
 * owner email *and* the account still holds the owner role.
 */
export function evaluateOwnership(input: {
  sessionEmail: string | null;
  ownerEmail: string | null;
  role: string | null;
}): OwnershipDecision {
  const { sessionEmail, ownerEmail, role } = input;

  if (!sessionEmail) return { allowed: false, reason: "No active session." };
  if (!ownerEmail) {
    return { allowed: false, reason: "No portfolio owner is configured." };
  }
  if (sessionEmail.trim().toLowerCase() !== ownerEmail.trim().toLowerCase()) {
    return { allowed: false, reason: "This account is not the portfolio owner." };
  }
  if (role !== "owner") {
    return { allowed: false, reason: "Owner role required." };
  }

  return { allowed: true };
}

/**
 * The single authorization gate for the admin surface.
 *
 * Ownership is defined exclusively by `settings.ownerEmail`. A session is
 * only accepted when all of the following hold:
 *
 *   1. the session cookie is present and cryptographically valid,
 *   2. the session email matches `settings.ownerEmail`,
 *   3. the account still exists with the `owner` role,
 *   4. the session has not been revoked via `tokenVersion`.
 */
export async function requireOwner(): Promise<OwnerContext> {
  const session = await readSession();
  if (!session) throw new UnauthorizedError("Sign in to continue");

  const repositories = await getRepositories();
  const settings = await repositories.settings.get();

  const ownerEmail = settings?.ownerEmail?.trim().toLowerCase() ?? "";
  if (!ownerEmail) {
    throw new ForbiddenError(
      "No portfolio owner is configured. Set the owner email in Settings.",
    );
  }

  if (session.email.trim().toLowerCase() !== ownerEmail) {
    throw new ForbiddenError("This account is not the portfolio owner.");
  }

  const user = await repositories.users.getByEmail(session.email);
  if (!user) throw new UnauthorizedError("This account no longer exists.");
  if (user.role !== "owner") throw new ForbiddenError("Owner role required.");
  if (user.tokenVersion !== session.tokenVersion) {
    throw new UnauthorizedError("Your session was revoked. Sign in again.");
  }

  if (!settings) {
    throw new ForbiddenError("Site settings are missing");
  }

  return { user, settings };
}

/** Non-throwing variant used to decide what to render. */
export async function getOwnerContext(): Promise<
  OwnerContext | { error: "unauthorized" | "forbidden"; message: string }
> {
  try {
    return await requireOwner();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { error: "unauthorized", message: error.message };
    }
    if (error instanceof ForbiddenError) {
      return { error: "forbidden", message: error.message };
    }
    throw error;
  }
}
