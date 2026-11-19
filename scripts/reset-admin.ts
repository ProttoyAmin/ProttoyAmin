/**
 * Resets the owner password from the command line.
 *
 * Usage: npm run admin:reset -- <new-password>
 *        ADMIN_EMAIL=me@example.com npm run admin:reset -- <new-password>
 */

import { hashPassword } from "../src/server/auth/password";
import { getRepositories } from "../src/server/db/registry";
import { env } from "../src/server/env";

async function main() {
  const password = process.argv[2] ?? env.admin.password;

  if (!password || password.length < 10) {
    console.error(
      "Provide a new password of at least 10 characters: npm run admin:reset -- <password>",
    );
    process.exit(1);
  }

  const repositories = await getRepositories();
  const email = (env.admin.email || "").trim().toLowerCase();

  const user = email
    ? await repositories.users.getByEmail(email)
    : (await repositories.users.list({ role: "owner" }, { createdAt: 1 }))[0];

  if (!user) {
    console.error(
      "No owner account found. Set ADMIN_EMAIL or bootstrap the account on first sign-in.",
    );
    process.exit(1);
  }

  await repositories.users.update(user.id, {
    passwordHash: await hashPassword(password),
    tokenVersion: (user.tokenVersion ?? 1) + 1,
    failedAttempts: 0,
  });

  console.log(`✓ Password updated for ${user.email}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
