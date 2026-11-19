/**
 * Content-Security-Policy construction.
 *
 * Kept in its own module (free of `next/server` imports) so it can be unit
 * tested and reused by the proxy.
 */

/**
 * Builds the CSP for a single request.
 *
 * The nonce is mandatory: `script-src` allows `'strict-dynamic'`, which
 * means *only* scripts carrying the matching nonce may execute. Without a
 * nonce the browser blocks every framework bundle, the page never hydrates,
 * and the whole site appears inert.
 */
export function buildCsp(nonce: string, options?: { isDev?: boolean }): string {
  const isDev = options?.isDev ?? process.env.NODE_ENV !== "production";

  return [
    "default-src 'self'",
    // Scripts are strict: only the nonced framework bundles may run.
    // `unsafe-eval` is required by React in development for stack traces.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      isDev ? " 'unsafe-eval'" : ""
    }`,
    // Animation libraries write inline styles (transform, opacity), so
    // styles stay permissive while scripts remain strict.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "media-src 'self' https://res.cloudinary.com",
    "connect-src 'self' https://api.cloudinary.com https://*.mongodb.net",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
