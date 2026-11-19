import "server-only";

export type MediaProvider = "cloudinary" | "local";

export interface SignedUpload {
  provider: MediaProvider;
  uploadUrl: string;
  fields: Record<string, string>;
  folder: string;
  maxBytes: number;
  accepts: string[];
}

export interface UploadedAsset {
  publicId: string;
  url: string;
  secureUrl: string;
  originalUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface MediaStorage {
  readonly provider: MediaProvider;
  signUpload(folder: string): Promise<SignedUpload>;
  /** Re-reads the asset from the provider so the client cannot spoof it. */
  verifyUpload(publicId: string): Promise<UploadedAsset | null>;
  remove(publicId: string): Promise<void>;
}
