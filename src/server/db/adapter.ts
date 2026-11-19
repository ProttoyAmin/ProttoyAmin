/**
 * Persistence adapter contract.
 *
 * Every collection is accessed through a small, driver-agnostic adapter.
 * The MongoDB adapter wraps Mongoose models; the memory adapter reads and
 * writes a JSON file. Typed repositories are built on top of this contract
 * (see `src/server/repositories/factory.ts`).
 */

export type SortSpec = Record<string, 1 | -1>;

export type QueryFilter = Record<string, unknown>;

export interface AdapterDoc {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionAdapter<T extends AdapterDoc> {
  readonly name: string;
  list(filter?: QueryFilter, sort?: SortSpec): Promise<T[]>;
  findOne(filter: QueryFilter): Promise<T | null>;
  insert(doc: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | null>;
  remove(id: string): Promise<boolean>;
  count(filter?: QueryFilter): Promise<number>;
  /** Removes every document matching the filter. Returns the number removed. */
  removeMany(filter?: QueryFilter): Promise<number>;
}
