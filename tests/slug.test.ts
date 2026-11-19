import { describe, expect, it } from "vitest";

import { slugify, uniqueSlug } from "@/lib/slug";
import { formatDateRange, readingTime } from "@/lib/format";

describe("slugify", () => {
  it("lower-cases and hyphenates", () => {
    expect(slugify("Insight Analytics Studio")).toBe(
      "insight-analytics-studio",
    );
  });

  it("strips accents and punctuation", () => {
    expect(slugify("Café & Crème — 2026")).toBe("cafe-creme-2026");
  });

  it("collapses repeated separators", () => {
    expect(slugify("hello   world!!!")).toBe("hello-world");
  });

  it("never returns an empty slug", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when it is free", () => {
    expect(uniqueSlug("My Project", () => false)).toBe("my-project");
  });

  it("appends a counter when taken", () => {
    const taken = new Set(["my-project", "my-project-2"]);
    expect(uniqueSlug("My Project", (candidate) => taken.has(candidate))).toBe(
      "my-project-3",
    );
  });
});

describe("formatDateRange", () => {
  it("renders a start and end month", () => {
    expect(formatDateRange("2024-02", "2025-06")).toBe("Feb 2024 — Jun 2025");
  });

  it("marks an open-ended role as Present", () => {
    expect(formatDateRange("2024-02", undefined)).toBe("Feb 2024 — Present");
  });
});

describe("readingTime", () => {
  it("never returns less than a minute", () => {
    expect(readingTime("a few words")).toBe(1);
  });

  it("scales with the word count", () => {
    expect(readingTime(Array.from({ length: 440 }, () => "word").join(" "))).toBe(
      2,
    );
  });
});
