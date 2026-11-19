import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { env } from "@/server/env";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import type { MediaStorage, SignedUpload, UploadedAsset } from "@/server/media/types";

function configure() {
  cloudinary.config({
    cloud_name: env.media.cloudinary.cloudName,
    api_key: env.media.cloudinary.apiKey,
    api_secret: env.media.cloudinary.apiSecret,
    secure: true,
  });
}

export function cloudinaryDeliveryUrl(publicId: string, width?: number): string {
  const { cloudName } = env.media.cloudinary;
  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`c_limit`, `w_${width}`);
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(",")}/${publicId}`;
}

export const cloudinaryStorage: MediaStorage = {
  provider: "cloudinary",

  async signUpload(folder: string): Promise<SignedUpload> {
    configure();

    const params = {
      timestamp: String(Math.round(Date.now() / 1000)),
      folder,
      overwrite: "false",
      use_filename: "false",
      tags: "portfolio",
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      env.media.cloudinary.apiSecret,
    );

    return {
      provider: "cloudinary",
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.media.cloudinary.cloudName}/image/upload`,
      fields: {
        ...params,
        api_key: env.media.cloudinary.apiKey,
        signature,
      },
      folder,
      maxBytes: MAX_UPLOAD_BYTES,
      accepts: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"],
    };
  },

  async verifyUpload(publicId: string): Promise<UploadedAsset | null> {
    configure();

    try {
      const resource = await cloudinary.api.resource(publicId);
      const secureUrl = String(resource.secure_url);
      return {
        publicId: String(resource.public_id),
        url: cloudinaryDeliveryUrl(String(resource.public_id)),
        secureUrl,
        originalUrl: secureUrl,
        format: String(resource.format ?? "jpg"),
        width: Number(resource.width ?? 0),
        height: Number(resource.height ?? 0),
        bytes: Number(resource.bytes ?? 0),
      };
    } catch (error) {
      console.error("[media] cloudinary verification failed:", error);
      return null;
    }
  },

  async remove(publicId: string): Promise<void> {
    configure();
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("[media] cloudinary delete failed:", error);
    }
  },
};
