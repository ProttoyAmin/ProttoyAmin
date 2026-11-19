import "server-only";

import { env, hasCloudinaryCredentials } from "@/server/env";
import { cloudinaryStorage } from "@/server/media/cloudinary";
import { localStorage } from "@/server/media/local";
import type { MediaStorage } from "@/server/media/types";

export type { MediaProvider, SignedUpload, UploadedAsset } from "@/server/media/types";
export { cloudinaryDeliveryUrl } from "@/server/media/cloudinary";

/**
 * Resolves the media driver.
 *
 * Cloudinary is used when its credentials are present (or forced through
 * `MEDIA_DRIVER=cloudinary`); otherwise the local disk driver takes over so
 * uploads keep working in development.
 */
export function getMediaStorage(): MediaStorage {
  if (env.media.driver === "cloudinary") return cloudinaryStorage;
  if (env.media.driver === "local") return localStorage;
  return hasCloudinaryCredentials() ? cloudinaryStorage : localStorage;
}

export function getMediaDriver(): "cloudinary" | "local" {
  return getMediaStorage().provider;
}
