import { describe, expect, it } from "vitest";

import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  isValidAccent,
  normalizeAccent,
  presetForAccent,
} from "@/lib/theme";
import { socialLinkSchema } from "@/lib/validation/content";

describe("accent colours", () => {
  it("offers exactly three presets", () => {
    expect(ACCENT_PRESETS).toHaveLength(3);
    expect(ACCENT_PRESETS.map((preset) => preset.id)).toEqual([
      "violet",
      "maroon",
      "emerald",
    ]);
  });

  it("accepts hex colours", () => {
    expect(isValidAccent("#6d4aff")).toBe(true);
    expect(isValidAccent("#fff")).toBe(true);
    expect(isValidAccent("6d4aff")).toBe(false);
    expect(isValidAccent("rgb(1,2,3)")).toBe(false);
    expect(isValidAccent("red")).toBe(false);
  });

  it("falls back to the default for a broken value", () => {
    expect(normalizeAccent(undefined)).toBe(DEFAULT_ACCENT);
    expect(normalizeAccent("")).toBe(DEFAULT_ACCENT);
    expect(normalizeAccent("not-a-colour")).toBe(DEFAULT_ACCENT);
  });

  it("normalises the shorthand form", () => {
    expect(normalizeAccent("#FFF")).toBe("#ffffff");
  });

  it("keeps a valid colour unchanged", () => {
    expect(normalizeAccent("#9B1C31")).toBe("#9b1c31");
  });

  it("matches a preset by colour", () => {
    expect(presetForAccent("#9b1c31")?.id).toBe("maroon");
    expect(presetForAccent("#123456")).toBeUndefined();
  });
});

describe("social links", () => {
  // Regression guard: the demo content ships a `mailto:` link. When the
  // schema rejected it, *every* settings save failed and the owner could
  // not change anything at all.
  it("accepts a mailto link", () => {
    const result = socialLinkSchema.safeParse({
      platform: "email",
      label: "Email",
      url: "mailto:hello@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts http and https links", () => {
    for (const url of ["https://example.com", "http://example.com"]) {
      const result = socialLinkSchema.safeParse({
        platform: "github",
        label: "GitHub",
        url,
      });
      expect(result.success).toBe(true);
    }
  });

  it("still rejects a nonsense URL", () => {
    const result = socialLinkSchema.safeParse({
      platform: "github",
      label: "GitHub",
      url: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });
});
