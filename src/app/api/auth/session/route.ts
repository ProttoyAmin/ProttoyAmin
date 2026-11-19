import { NextResponse } from "next/server";

import { getOwnerContext } from "@/server/auth/owner";
import { getSessionUser } from "@/server/auth/session";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ authenticated: false, isOwner: false });
  }

  const owner = await getOwnerContext();
  return NextResponse.json({
    authenticated: true,
    email: session.email,
    isOwner: owner !== null && !("error" in owner),
  });
}
