import { describe, expect, it } from "vitest";

import { buildCsp } from "@/server/security/csp";

/**
 * Regression guard for the release-blocking defect: the policy shipped
 * without a nonce, so the browser blocked every framework bundle. The page
 * rendered, but nothing hydrated — navigation was dead and the admin panel
 * stayed blank.
 */
describe("content security policy", () => {
  const nonce = "dGVzdC1ub25jZS12YWx1ZQ==";

  it("puts the request nonce into script-src", () => {
    const csp = buildCsp(nonce, { isDev: false });
    expect(csp).toContain(`'nonce-${nonce}'`);
  });

  it("keeps 'strict-dynamic' — the nonce is what unlocks the scripts", () => {
    const csp = buildCsp(nonce, { isDev: false });
    expect(csp).toContain("'strict-dynamic'");
  });

  it("never ships a script-src without a nonce", () => {
    const csp = buildCsp(nonce, { isDev: false });
    const scriptSrc = csp
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("script-src"));

    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).toMatch(/nonce-[A-Za-z0-9+/=]+/);
  });

  it("emits a different policy for every request", () => {
    const first = buildCsp("nonce-one", { isDev: false });
    const second = buildCsp("nonce-two", { isDev: false });
    expect(first).not.toBe(second);
  });

  it("allows inline styles for the animation library", () => {
    expect(buildCsp(nonce, { isDev: false })).toContain(
      "style-src 'self' 'unsafe-inline'",
    );
  });

  it("only allows unsafe-eval in development", () => {
    expect(buildCsp(nonce, { isDev: true })).toContain("'unsafe-eval'");
    expect(buildCsp(nonce, { isDev: false })).not.toContain("'unsafe-eval'");
  });

  it("locks down framing, objects and base URIs", () => {
    const csp = buildCsp(nonce, { isDev: false });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });
});
