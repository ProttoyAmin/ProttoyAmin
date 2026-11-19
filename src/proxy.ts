import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/server/auth/token";
import { buildCsp } from "@/server/security/csp";

/**
 * The Next 16 network boundary.
 *
 * Two independent jobs:
 *   1. Generate a per-request CSP nonce and hand it to the renderer, so
 *      Next.js attaches it to every script it emits. Without a nonce the
 *      strict policy below would block all JavaScript and the page would
 *      render without any interactivity (dead navigation, blank admin).
 *   2. Act as a coarse routing gate for the admin surface only.
 */

/**
 * The admin surface is protected by a session cookie. Ownership itself is
 * verified in the admin layout where the database is reachable.
 */
async function gateAdminRoute(
  request: NextRequest,
  session: Awaited<ReturnType<typeof verifySessionToken>>,
) {
  const { pathname } = request.nextUrl;

  // Only the admin surface is gated. Every other route is public and must
  // never be redirected.
  if (!pathname.startsWith("/admin")) {
    return null;
  }

  if (pathname.startsWith("/admin/login")) {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return null;
  }

  if (!session) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Next.js parses the nonce out of the *request* CSP header while
  // rendering, and attaches it to every script it emits.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token).catch(() => null);

  const redirect = await gateAdminRoute(request, session);
  if (redirect) {
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    {
      // Every document request, so the nonce reaches the renderer.
      // API routes, static assets and the local media route never render a
      // document, so they are skipped.
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
