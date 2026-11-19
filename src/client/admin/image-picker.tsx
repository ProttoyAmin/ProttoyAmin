/* eslint-disable @next/next/no-img-element --
   Portfolio media is user supplied and may be SVG, which next/image
   refuses to optimise; the images are served as-is by design. */
"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildDeliveryUrl } from "@/lib/media-url";
import type { ImageAsset } from "@/server/types";
import type { MediaAsset } from "@/server/types";

/**
 * Uploads an image (Cloudinary when configured, local disk otherwise) and
 * lets the owner pick an existing asset from the library.
 */
export function ImagePicker({
  value,
  onChange,
  folder = "portfolio",
  library = [],
  label = "Cover image",
}: {
  value?: ImageAsset;
  onChange: (value: ImageAsset | undefined) => void;
  folder?: string;
  library?: MediaAsset[];
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [showLibrary, setShowLibrary] = React.useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const signResponse = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });

      if (!signResponse.ok) {
        const body = await signResponse.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not prepare the upload");
      }

      const signed = (await signResponse.json()) as {
        provider: "cloudinary" | "local";
        uploadUrl: string;
        fields: Record<string, string>;
      };

      const form = new FormData();
      form.append("file", file);
      for (const [key, entry] of Object.entries(signed.fields)) {
        form.append(key, entry);
      }

      const uploadResponse = await fetch(signed.uploadUrl, {
        method: "POST",
        body: form,
      });

      if (!uploadResponse.ok) {
        throw new Error("The upload was rejected by the media provider");
      }

      const uploaded = (await uploadResponse.json()) as { public_id?: string; publicId?: string };
      const publicId = uploaded.public_id ?? uploaded.publicId;
      if (!publicId) throw new Error("The provider did not return an asset id");

      const completeResponse = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, folder }),
      });

      if (!completeResponse.ok) {
        const body = await completeResponse.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not register the upload");
      }

      const { media } = (await completeResponse.json()) as { media: MediaAsset };

      onChange({
        url: buildDeliveryUrl(media, { width: 1600 }),
        publicId: media.publicId,
        width: media.width,
        height: media.height,
        alt: value?.alt ?? "",
      });

      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>

      {value?.url ? (
        <div className="flex items-start gap-4">
          <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2">
            <img
              src={value.url}
              alt={value.alt ?? "Selected image"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Alt text"
              defaultValue={value.alt ?? ""}
              onChange={(event) =>
                onChange({ ...value, alt: event.target.value })
              }
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange(undefined)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface/40 px-4 py-8 text-sm text-muted transition-colors hover:border-accent/50 hover:text-foreground"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading…" : "Upload an image"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      {library.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowLibrary((current) => !current)}
            className="text-xs text-accent hover:underline"
          >
            {showLibrary ? "Hide media library" : "Pick from media library"}
          </button>

          {showLibrary ? (
            <div className="mt-3 grid max-h-64 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-line p-3">
              {library.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onChange({
                      url: buildDeliveryUrl(asset, { width: 1600 }),
                      publicId: asset.publicId,
                      width: asset.width,
                      height: asset.height,
                      alt: asset.alt ?? "",
                    });
                    setShowLibrary(false);
                  }}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-line"
                >
                  <img
                    src={buildDeliveryUrl(asset, { width: 320 })}
                    alt={asset.alt ?? asset.publicId}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
