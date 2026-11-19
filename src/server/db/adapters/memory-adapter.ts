import "server-only";

import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { newId } from "@/server/ids";
import type {
  AdapterDoc,
  CollectionAdapter,
  QueryFilter,
  SortSpec,
} from "@/server/db/adapter";

type Store = Record<string, AdapterDoc[]>;

const DATA_DIR =
  process.env.PORTFOLIO_DATA_DIR ?? path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

/**
 * A tiny file-backed document store used for local development, CI and
 * preview environments where no MongoDB cluster is reachable.
 *
 * It is intentionally simple: one JSON file, atomic writes, and a serialised
 * write queue to avoid interleaved mutations.
 *
 * The file is re-read whenever it changes on disk, because Next.js compiles
 * server components and route handlers into separate module graphs — a
 * long-lived in-memory cache would otherwise serve stale documents.
 */
export class MemoryStore {
  private store: Store = {};
  private loaded = false;
  private lastModified = 0;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string = DATA_FILE) {}

  async load(seed: Store = {}): Promise<void> {
    const stats = await stat(this.filePath).catch(() => null);

    if (!stats) {
      if (this.loaded) return;
      this.store = { ...seed };
      this.loaded = true;
      await this.persist();
      return;
    }

    if (this.loaded && stats.mtimeMs <= this.lastModified) return;

    try {
      const raw = await readFile(this.filePath, "utf8");
      this.store = { ...seed, ...(JSON.parse(raw) as Store) };
      this.lastModified = stats.mtimeMs;
      this.loaded = true;
    } catch {
      this.store = { ...seed };
      this.loaded = true;
    }
  }

  collection<T extends AdapterDoc>(name: string): CollectionAdapter<T> {
    return new MemoryCollection<T>(this, name);
  }

  bucket(name: string): AdapterDoc[] {
    if (!this.store[name]) this.store[name] = [];
    return this.store[name];
  }

  /** Serialises writes so concurrent requests never interleave. */
  async mutate<T>(fn: () => Promise<T> | T): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }

  async persist(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const payload = JSON.stringify(this.store, null, 2);
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, payload, "utf8");
    // Atomic swap: readers never observe a half-written file.
    await rename(tmp, this.filePath);
    this.lastModified = Date.now();
  }
}

class MemoryCollection<T extends AdapterDoc> implements CollectionAdapter<T> {
  constructor(
    private readonly store: MemoryStore,
    readonly name: string,
  ) {}

  async list(filter?: QueryFilter, sort?: SortSpec): Promise<T[]> {
    await this.store.load();
    const docs = this.store.bucket(this.name) as T[];
    const filtered = filter ? docs.filter((doc) => matches(doc, filter)) : docs;
    return sortDocuments(filtered, sort);
  }

  async findOne(filter: QueryFilter): Promise<T | null> {
    const [doc] = await this.list(filter);
    return doc ?? null;
  }

  async insert(
    doc: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ): Promise<T> {
    return this.store.mutate(async () => {
      const now = new Date().toISOString();
      const record = {
        ...doc,
        id: doc.id ?? newId(),
        createdAt: now,
        updatedAt: now,
      } as T;
      this.store.bucket(this.name).push(record);
      await this.store.persist();
      return record;
    });
  }

  async update(id: string, patch: Partial<T>): Promise<T | null> {
    return this.store.mutate(async () => {
      const bucket = this.store.bucket(this.name) as T[];
      const index = bucket.findIndex((doc) => doc.id === id);
      if (index === -1) return null;
      const current = bucket[index];
      if (!current) return null;
      const next = {
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      } as T;
      bucket[index] = next;
      await this.store.persist();
      return next;
    });
  }

  async remove(id: string): Promise<boolean> {
    return this.store.mutate(async () => {
      const bucket = this.store.bucket(this.name) as T[];
      const index = bucket.findIndex((doc) => doc.id === id);
      if (index === -1) return false;
      bucket.splice(index, 1);
      await this.store.persist();
      return true;
    });
  }

  async count(filter?: QueryFilter): Promise<number> {
    return (await this.list(filter)).length;
  }

  async removeMany(filter?: QueryFilter): Promise<number> {
    return this.store.mutate(async () => {
      const bucket = this.store.bucket(this.name) as T[];
      const keep = filter ? bucket.filter((doc) => !matches(doc, filter)) : [];
      const removed = bucket.length - keep.length;
      this.store.bucket(this.name).length = 0;
      this.store.bucket(this.name).push(...keep);
      await this.store.persist();
      return removed;
    });
  }
}

/** Supports equality plus the `$in` / `$nin` operators used by the repositories. */
export function matches(doc: AdapterDoc, filter: QueryFilter): boolean {
  for (const [key, condition] of Object.entries(filter)) {
    const value = (doc as unknown as Record<string, unknown>)[key];

    if (condition && typeof condition === "object" && !Array.isArray(condition)) {
      const operators = condition as Record<string, unknown>;
      if ("$in" in operators) {
        const allowed = operators["$in"];
        if (!Array.isArray(allowed)) return false;
        // Mongo semantics: an array field matches when it contains any of the
        // listed values.
        const hit = Array.isArray(value)
          ? value.some((entry) => allowed.includes(entry))
          : allowed.includes(value);
        if (!hit) return false;
      }
      if ("$nin" in operators) {
        const denied = operators["$nin"];
        if (Array.isArray(denied)) {
          const hit = Array.isArray(value)
            ? value.some((entry) => denied.includes(entry))
            : denied.includes(value);
          if (hit) return false;
        }
      }
      if ("$ne" in operators && value === operators["$ne"]) return false;
      continue;
    }

    if (value !== condition) return false;
  }
  return true;
}

export function sortDocuments<T>(docs: T[], sort?: SortSpec): T[] {
  if (!sort) return [...docs];

  const entries = Object.entries(sort);
  if (entries.length === 0) return [...docs];

  return [...docs].sort((a, b) => {
    for (const [key, direction] of entries) {
      const left = (a as unknown as Record<string, unknown>)[key];
      const right = (b as unknown as Record<string, unknown>)[key];

      if (left === right) continue;
      if (left === undefined || left === null) return direction * 1;
      if (right === undefined || right === null) return direction * -1;

      const comparison = String(left).localeCompare(String(right), undefined, {
        numeric: true,
      });
      if (comparison !== 0) return comparison * direction;
    }
    return 0;
  });
}
