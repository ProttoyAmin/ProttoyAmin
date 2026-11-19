import { NextResponse } from "next/server";

import { readSession, destroySession } from "@/server/auth/session";
import { getRepositories } from "@/server/db/registry";
import { recordAudit } from "@/server/services/audit.service";

export async function POST(request: Request) {
  const session = await readSession();

  if (session) {
    try {
      const repositories = await getRepositories();
      const user = await repositories.users.getByEmail(session.email);
      if (user) {
        // Bumping the token version revokes every session for this account.
        await repositories.users.update(user.id, {
          tokenVersion: (user.tokenVersion ?? 1) + 1,
        });
      }
      await recordAudit({
        actorEmail: session.email,
        action: "logout",
        entity: "users",
        entityId: session.id,
        ip: request.headers.get("x-forwarded-for") ?? undefined,
      });
    } catch (error) {
      console.error("[auth] logout cleanup failed:", error);
    }
  }

  await destroySession();
  return NextResponse.json({ ok: true });
}
