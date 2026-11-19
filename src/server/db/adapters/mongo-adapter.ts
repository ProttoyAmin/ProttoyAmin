import "server-only";

import type { Model } from "mongoose";

import type {
  AdapterDoc,
  CollectionAdapter,
  QueryFilter,
  SortSpec,
} from "@/server/db/adapter";

/**
 * Bridges a Mongoose model to the driver-agnostic adapter contract.
 */
export function createMongoAdapter<T extends AdapterDoc>(
  model: unknown,
  name: string,
): CollectionAdapter<T> {
  const collection = model as Model<Record<string, unknown>>;

  return {
    name,

    async list(filter?: QueryFilter, sort?: SortSpec): Promise<T[]> {
      const query = collection.find(translateFilter(filter));
      if (sort) query.sort(sort);
      const docs = await query.lean().exec();
      return docs.map((doc) => mapDoc<T>(doc));
    },

    async findOne(filter: QueryFilter): Promise<T | null> {
      const doc = await collection.findOne(translateFilter(filter)).lean().exec();
      return doc ? mapDoc<T>(doc) : null;
    },

    async insert(
      doc: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string },
    ): Promise<T> {
      const { id: _ignored, ...payload } = doc as Record<string, unknown>;
      const created = await collection.create(payload);
      return mapDoc<T>(created.toObject());
    },

    async update(id: string, patch: Partial<T>): Promise<T | null> {
      const { id: _ignored, createdAt: _c, updatedAt: _u, ...payload } =
        patch as Record<string, unknown>;
      const updated = await collection
        .findByIdAndUpdate(id, payload, { new: true })
        .lean()
        .exec();
      return updated ? mapDoc<T>(updated) : null;
    },

    async remove(id: string): Promise<boolean> {
      const result = await collection.findByIdAndDelete(id).lean().exec();
      return Boolean(result);
    },

    async count(filter?: QueryFilter): Promise<number> {
      return collection.countDocuments(filter ?? {}).exec();
    },

    async removeMany(filter?: QueryFilter): Promise<number> {
      const result = await collection.deleteMany(filter ?? {}).exec();
      return result.deletedCount ?? 0;
    },
  };
}

/**
 * The repositories address documents by the portable `id` field. MongoDB
 * stores them in `_id`, so the `id` key is translated before querying.
 */
function translateFilter(filter?: QueryFilter): QueryFilter {
  if (!filter) return {};

  const translated: QueryFilter = {};
  for (const [key, value] of Object.entries(filter)) {
    if (key === "id") {
      translated._id = value;
      continue;
    }
    translated[key] = value;
  }
  return translated;
}

/** Converts a lean Mongoose document into the shared domain shape. */
export function mapDoc<T>(doc: Record<string, unknown>): T {
  const { _id, __v: _version, createdAt, updatedAt, ...rest } = doc;

  const id =
    _id && typeof _id === "object" && "toString" in _id
      ? (_id as { toString(): string }).toString()
      : String(_id ?? "");

  return {
    ...rest,
    id,
    createdAt: toIso(createdAt),
    updatedAt: toIso(updatedAt),
  } as unknown as T;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}
