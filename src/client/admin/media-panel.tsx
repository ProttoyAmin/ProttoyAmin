/* eslint-disable @next/next/no-img-element --
   Portfolio media is user supplied and may be SVG, which next/image
   refuses to optimise; the images are served as-is by design. */
"use client";

import { Copy, Trash2, Upload } from "@/components/ui/icons";
import * as React from "react";
import { toast } from "sonner";

import { ImagePicker } from "@/client/admin/image-picker";
import { useServerAction } from "@/client/admin/use-server-action";
import type { MediaData } from "@/client/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buildDeliveryUrl } from "@/lib/media-url";
import type { ImageAsset } from "@/server/types";

export function MediaPanel({ data }: { data: MediaData }) {
  const { pending, run } = useServerAction();
  const [uploaded, setUploaded] = React.useState<ImageAsset | undefined>();

  async function removeAsset(publicId: string) {
    if (!confirm("Delete this asset?")) return;

    const response = await fetch("/api/upload/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      toast.error(result.error ?? "Could not delete the asset");
      return;
    }

    toast.success("Asset deleted");
    run(async () => ({ ok: true }));
  }

  function copyUrl(url: string) {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("URL copied"))
      .catch(() => toast.error("Could not copy the URL"));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Media</h1>
        <p className="mt-1 text-sm text-muted">
          Every uploaded image, stored with its optimised delivery URL.
        </p>
      </header>

      <Card>
        <ImagePicker
          value={uploaded ?? undefined}
          onChange={(value) => setUploaded(value)}
          library={data.media}
          folder="portfolio"
          label="Upload a new asset"
        />
      </Card>

      {data.media.length === 0 ? (
        <EmptyState
          title="No media yet"
          description="Upload a cover image or a project screenshot to get started."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.media.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-xl border border-line"
            >
              <img
                src={buildDeliveryUrl(asset, { width: 480 })}
                alt={asset.alt ?? asset.publicId}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Copy URL"
                  className="h-8 w-8 text-white hover:bg-white/15"
                  onClick={() => copyUrl(buildDeliveryUrl(asset))}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete asset"
                  disabled={pending}
                  className="h-8 w-8 text-white hover:bg-white/15"
                  onClick={() => removeAsset(asset.publicId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {asset.format.toUpperCase()} · {asset.width}×{asset.height}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted">
        <Upload className="h-3.5 w-3.5" />
        Uploads are served through{" "}
        {data.runtime.media.driver === "cloudinary"
          ? "Cloudinary with automatic format and quality optimisation"
          : "the local disk driver — add Cloudinary credentials to switch"}
        .
      </p>
    </div>
  );
}
