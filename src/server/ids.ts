import "server-only";

import { randomBytes } from "node:crypto";

/**
 * Generates a MongoDB-compatible 24 character hex id.
 * The memory driver reuses the same shape so ids are interchangeable
 * between drivers.
 */
export function newId(): string {
  return randomBytes(12).toString("hex");
}

export function isValidId(value: string): boolean {
  return /^[a-f0-9]{24}$/i.test(value);
}
