import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Verifies the demo-content fallback contract:
 *
 *   real content wins, per collection — as soon as the owner publishes
 *   something for a collection, the demo entries for that collection
 *   disappear while the other collections keep their demo data.
 */

// A unique directory per run keeps the suite hermetic and prevents it from
// colliding with a development server that is running at the same time.
let dataDir = "";

let getRepositories: typeof import("@/server/db/registry")["getRepositories"];
let getSiteContent: typeof import("@/server/services/content.service")["getSiteContent"];

beforeAll(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "portfolio-content-"));
  process.env.PORTFOLIO_DATA_DIR = dataDir;
  process.env.DB_DRIVER = "memory";

  const registry = await import("@/server/db/registry");
  const content = await import("@/server/services/content.service");
  getRepositories = registry.getRepositories;
  getSiteContent = content.getSiteContent;
});

describe("content service", () => {
  it("serves demo content while the collections are empty", async () => {
    const content = await getSiteContent();

    expect(content.projects.length).toBeGreaterThan(0);
    expect(content.demo.projects).toBe(true);
    expect(content.demo.experiences).toBe(true);
    expect(content.demo.skills).toBe(true);
    expect(content.settings.siteTitle).toBeTruthy();
  });

  it("replaces the demo projects as soon as a real one is published", async () => {
    const repositories = await getRepositories();

    await repositories.projects.create({
      title: "My real project",
      slug: "my-real-project",
      summary: "Published from the admin panel.",
      description: "",
      gallery: [],
      tags: ["Next.js"],
      links: {},
      featured: false,
      published: true,
      order: 1,
      metrics: [],
      seo: { title: "", description: "" },
      isDummy: false,
    });

    const content = await getSiteContent();

    expect(content.demo.projects).toBe(false);
    expect(content.projects).toHaveLength(1);
    expect(content.projects[0]?.title).toBe("My real project");

    // Other collections still fall back to the demo content.
    expect(content.demo.experiences).toBe(true);
    expect(content.experiences.length).toBeGreaterThan(0);
  });

  it("keeps drafts out of the public payload", async () => {
    const repositories = await getRepositories();

    await repositories.projects.create({
      title: "Secret draft",
      slug: "secret-draft",
      summary: "",
      description: "",
      gallery: [],
      tags: [],
      links: {},
      featured: false,
      published: false,
      order: 2,
      metrics: [],
      seo: { title: "", description: "" },
      isDummy: false,
    });

    const content = await getSiteContent();
    const titles = content.projects.map((project) => project.title);

    expect(titles).not.toContain("Secret draft");
    expect(titles).toContain("My real project");
  });
});
