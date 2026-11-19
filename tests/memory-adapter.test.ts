import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { MemoryStore } from "@/server/db/adapters/memory-adapter";

let directory: string;
let store: MemoryStore;

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "portfolio-store-"));
  store = new MemoryStore(path.join(directory, "db.json"));
  await store.load({});
});

afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});

interface Doc {
  id: string;
  title: string;
  published: boolean;
  order: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

describe("MemoryStore", () => {
  it("inserts and reads documents back", async () => {
    const collection = store.collection<Doc>("projects");
    const created = await collection.insert({
      title: "Alpha",
      published: true,
      order: 1,
      tags: ["next"],
    });

    expect(created.id).toMatch(/^[a-f0-9]{24}$/);
    expect(created.createdAt).toBeTruthy();

    const all = await collection.list();
    expect(all).toHaveLength(1);
  });

  it("filters on equality and $in", async () => {
    const collection = store.collection<Doc>("filters");
    await collection.insert({
      title: "A",
      published: true,
      order: 2,
      tags: ["react"],
    });
    await collection.insert({
      title: "B",
      published: false,
      order: 1,
      tags: ["go"],
    });

    const published = await collection.list({ published: true });
    expect(published).toHaveLength(1);
    expect(published[0]?.title).toBe("A");

    const tagged = await collection.list({ tags: { $in: ["go", "rust"] } });
    expect(tagged).toHaveLength(1);
    expect(tagged[0]?.title).toBe("B");
  });

  it("sorts by multiple keys", async () => {
    const collection = store.collection<Doc>("sorted");
    await collection.insert({ title: "second", published: true, order: 2, tags: [] });
    await collection.insert({ title: "first", published: true, order: 1, tags: [] });

    const sorted = await collection.list({}, { order: 1 });
    expect(sorted.map((doc) => doc.title)).toEqual(["first", "second"]);
  });

  it("updates without losing the id or creation time", async () => {
    const collection = store.collection<Doc>("updated");
    const created = await collection.insert({
      title: "Before",
      published: true,
      order: 0,
      tags: [],
    });

    const updated = await collection.update(created.id, { title: "After" });
    expect(updated?.title).toBe("After");
    expect(updated?.id).toBe(created.id);
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
  });

  it("removes documents", async () => {
    const collection = store.collection<Doc>("removed");
    const created = await collection.insert({
      title: "Bye",
      published: true,
      order: 0,
      tags: [],
    });

    expect(await collection.remove(created.id)).toBe(true);
    expect(await collection.remove(created.id)).toBe(false);
    expect(await collection.count()).toBe(0);
  });

  it("survives a reload from disk", async () => {
    const filePath = path.join(directory, "reload.json");
    const first = new MemoryStore(filePath);
    await first.load({});
    await first.collection<Doc>("docs").insert({
      title: "Persisted",
      published: true,
      order: 0,
      tags: [],
    });

    const second = new MemoryStore(filePath);
    await second.load({});
    const docs = await second.collection<Doc>("docs").list();
    expect(docs).toHaveLength(1);
    expect(docs[0]?.title).toBe("Persisted");
  });
});
