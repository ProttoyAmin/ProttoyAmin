/**
 * URL-safe slug helpers. Pure, isomorphic, no dependencies.
 */

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Produce a slug that does not collide with `existing`.
 * `isTaken` is a synchronous predicate (e.g. a lookup against loaded records).
 */
export function uniqueSlug(
  input: string,
  isTaken: (candidate: string) => boolean,
): string {
  const base = slugify(input) || "untitled";
  if (!isTaken(base)) return base;

  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}-${i}`;
    if (!isTaken(candidate)) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}
