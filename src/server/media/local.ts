import "server-only";

import { createHmac } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { env } from "@/server/env";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { newId } from "@/server/ids";
import type { MediaStorage, SignedUpload, UploadedAsset } from "@/server/media/types";

const DATA_DIR =
  process.env.PORTFOLIO_DATA_DIR ?? path.join(process.cwd(), ".data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export interface LocalAssetMeta {
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  originalName: string;
}

function signPayload(payload: string): string {
  const secret = env.session.secret || "portfolio-development-secret";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Short-lived signature that authorises a local upload for one folder. */
export function createLocalUploadToken(folder: string, expiresAt: number): string {
  return signPayload(`${folder}:${expiresAt}`);
}

export function verifyLocalUploadToken(
  folder: string,
  expiresAt: number,
  token: string,
): boolean {
  if (!token) return false;
  if (expiresAt < Date.now()) return false;
  const expected = createLocalUploadToken(folder, expiresAt);
  return expected === token;
}

export async function saveLocalFile(
  buffer: Buffer,
  folder: string,
  originalName: string,
): Promise<LocalAssetMeta> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const publicId = `${folder}/${newId()}`;
  const image = sharp(buffer, { failOn: "none" });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unsupported or corrupt image file");
  }

  const format = metadata.format ?? "jpg";
  const filePath = path.join(UPLOAD_DIR, `${publicId.replace(/\//g, "_")}.${format}`);

  await writeFile(filePath, buffer);
  await writeFile(
    path.join(UPLOAD_DIR, `${publicId.replace(/\//g, "_")}.json`),
    JSON.stringify(
      {
        publicId,
        format,
        width: metadata.width,
        height: metadata.height,
        bytes: buffer.byteLength,
        originalName,
      } satisfies LocalAssetMeta,
      null,
      2,
    ),
    "utf8",
  );

  return {
    publicId,
    format,
    width: metadata.width,
    height: metadata.height,
    bytes: buffer.byteLength,
    originalName,
  };
}

export async function readLocalFile(publicId: string): Promise<
  { buffer: Buffer; meta: LocalAssetMeta } | null
> {
  const safe = publicId.replace(/[^a-zA-Z0-9/_-]/g, "");
  const base = path.join(UPLOAD_DIR, safe.replace(/\//g, "_"));

  try {
    const raw = JSON.parse(
      await readFile(`${base}.json`, "utf8"),
    ) as LocalAssetMeta;
    const format = raw.format;
    const buffer = await readFile(`${base}.${format}`);
    return { buffer, meta: raw };
  } catch {
    return null;
  }
}

export const localStorage: MediaStorage = {
  provider: "local",

  async signUpload(folder: string): Promise<SignedUpload> {
    const expiresAt = Date.now() + 10 * 60 * 1000;
    return {
      provider: "local",
      uploadUrl: "/api/upload/local",
      fields: {
        folder,
        expiresAt: String(expiresAt),
        token: createLocalUploadToken(folder, expiresAt),
      },
      folder,
      maxBytes: MAX_UPLOAD_BYTES,
      accepts: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"],
    };
  },

  async verifyUpload(publicId: string): Promise<UploadedAsset | null> {
    const file = await readLocalFile(publicId);
    if (!file) return null;

    const url = `/api/media/${publicId}`;
    return {
      publicId: file.meta.publicId,
      url,
      secureUrl: url,
      originalUrl: url,
      format: file.meta.format,
      width: file.meta.width,
      height: file.meta.height,
      bytes: file.meta.bytes,
    };
  },

  async remove(publicId: string): Promise<void> {
    const safe = publicId.replace(/[^a-zA-Z0-9/_-]/g, "");
    const base = path.join(UPLOAD_DIR, safe.replace(/\//g, "_"));
    try {
      const raw = JSON.parse(await readFile(`${base}.json`, "utf8")) as LocalAssetMeta;
      await rm(`${base}.${raw.format}`, { force: true });
      await rm(`${base}.json`, { force: true });
    } catch {
      // Nothing to remove.
    }
  },
};
