/**
 * Delivery URL helpers. Isomorphic — usable from server and client components.
 */

export interface MediaReference {
  provider?: string;
  publicId?: string;
  url?: string;
}

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
  process.env.CLOUDINARY_CLOUD_NAME ??
  "";

export function buildDeliveryUrl(
  asset: MediaReference,
  options: { width?: number; quality?: "auto" | number } = {},
): string {
  if (!asset) return "";

  if (asset.provider === "cloudinary" && asset.publicId && CLOUD_NAME) {
    const transforms = ["f_auto", `q_${options.quality === "auto" || !options.quality ? "auto" : options.quality}`];
    if (options.width) transforms.push("c_limit", `w_${options.width}`);
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms.join(",")}/${asset.publicId}`;
  }

  if (asset.provider === "local" && asset.publicId) {
    return `/api/media/${asset.publicId}`;
  }

  return asset.url ?? "";
}
