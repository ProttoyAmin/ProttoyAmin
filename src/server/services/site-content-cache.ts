import "server-only";

import { unstable_cache } from "next/cache";

import { getSiteContent, type SiteContent } from "@/server/services/content.service";

/**
 * The cache tag every admin mutation invalidates.
 *
 * `updateTag(CONTENT_CACHE_TAG)` gives read-your-own-writes: a project
 * published in the admin panel is visible on the very next public request.
 */
export const CONTENT_CACHE_TAG = "site-content";

/**
 * The cached variant of `getSiteContent`.
 *
 * The public page is rendered per request (it carries a per-request CSP
 * nonce), so without this every request would hit the database. The cache
 * is tagged, so admin mutations can expire it precisely.
 *
 * This module is imported only from server components — `unstable_cache`
 * requires the Next.js request context.
 */
export const getCachedSiteContent = unstable_cache(
  async (): Promise<SiteContent> => getSiteContent(),
  ["site-content"],
  { tags: [CONTENT_CACHE_TAG] },
);
