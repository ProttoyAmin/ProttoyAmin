import { describe, expect, it } from "vitest";

import { evaluateOwnership } from "@/server/auth/owner";

describe("evaluateOwnership", () => {
  it("allows the configured owner", () => {
    const decision = evaluateOwnership({
      sessionEmail: "owner@example.com",
      ownerEmail: "owner@example.com",
      role: "owner",
    });
    expect(decision.allowed).toBe(true);
  });

  it("is case insensitive", () => {
    const decision = evaluateOwnership({
      sessionEmail: "Owner@Example.com",
      ownerEmail: "owner@example.com",
      role: "owner",
    });
    expect(decision.allowed).toBe(true);
  });

  it("rejects an anonymous visitor", () => {
    const decision = evaluateOwnership({
      sessionEmail: null,
      ownerEmail: "owner@example.com",
      role: "owner",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/session/i);
  });

  it("rejects a signed-in non-owner", () => {
    const decision = evaluateOwnership({
      sessionEmail: "someone@example.com",
      ownerEmail: "owner@example.com",
      role: "owner",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/not the portfolio owner/i);
  });

  it("rejects an account without the owner role", () => {
    const decision = evaluateOwnership({
      sessionEmail: "owner@example.com",
      ownerEmail: "owner@example.com",
      role: "editor",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/role/i);
  });

  it("rejects everything when no owner is configured", () => {
    const decision = evaluateOwnership({
      sessionEmail: "owner@example.com",
      ownerEmail: "",
      role: "owner",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/no portfolio owner/i);
  });
});
