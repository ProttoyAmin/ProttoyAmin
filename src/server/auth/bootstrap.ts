import "server-only";

import { hashPassword } from "@/server/auth/password";
import { getRepositories } from "@/server/db/registry";
import { env } from "@/server/env";
import type { AdminUser } from "@/server/types";

/** Development fallback credentials — never used in production. */
export const DEV_ADMIN_EMAIL = "md.jahid.bin.amin@gmail.com";
export const DEV_ADMIN_PASSWORD = "portfolio-admin";

/**
 * Creates the owner account on first run.
 *
 * - Uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` when provided.
 * - Falls back to development defaults so the admin panel is reachable in a
 *   fresh clone.
 * - Also stamps `settings.ownerEmail` — the single source of truth for
 *   who may administer the site.
 */
export async function ensureOwnerUser(): Promise<AdminUser | null> {
  const repositories = await getRepositories();

  const existingCount = await repositories.users.count({});
  if (existingCount > 0) {
    const settings = await repositories.settings.get();
    if (settings && !settings.ownerEmail) {
      const owners = await repositories.users.list({ role: "owner" }, { createdAt: 1 });
      const first = owners[0];
      if (first) {
        await repositories.settings.save({ ownerEmail: first.email });
      }
    }
    return null;
  }

  const email = (env.admin.email || DEV_ADMIN_EMAIL).trim().toLowerCase();
  const password = env.admin.password || (!env.isProduction ? DEV_ADMIN_PASSWORD : "");

  if (!password) {
    console.warn(
      "[auth] No ADMIN_PASSWORD set — skipping owner bootstrap. Set it and restart.",
    );
    return null;
  }

  const user = await repositories.users.create({
    email,
    name: "Owner",
    passwordHash: await hashPassword(password),
    role: "owner",
    tokenVersion: 1,
    twoFactorEnabled: false,
    failedAttempts: 0,
  });

  const settings = await repositories.settings.get();
  if (!settings) {
    const { DUMMY_SETTINGS } = await import("@/seed/dummy");
    await repositories.settings.save({ ...DUMMY_SETTINGS, ownerEmail: email });
  } else if (!settings.ownerEmail) {
    await repositories.settings.save({ ownerEmail: email });
  }

  if (!env.admin.password && !env.isProduction) {
    console.warn(
      `[auth] Bootstrapped the development owner account: ${email} / ${DEV_ADMIN_PASSWORD}`,
    );
  }

  return user;
}
