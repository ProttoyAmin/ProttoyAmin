import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/server/auth/token";

/**
 * Coarse routing gate for the admin surface (Next 16 `proxy` convention,
 * formerly `middleware`).
 *
 * It only answers "is there a valid session?". Ownership is verified in the
 * admin layout, where the database is reachable — a stale cookie therefore
 * reaches the login screen with a clear message instead of a 403 loop.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token).catch(() => null);

  if (pathname.startsWith("/admin/login")) {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
