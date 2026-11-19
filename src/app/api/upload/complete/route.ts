import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOwner } from "@/server/auth/owner";
import { getRepositories } from "@/server/db/registry";
import { getMediaStorage } from "@/server/media";
import { recordAudit } from "@/server/services/audit.service";

const bodySchema = z.object({
  publicId: z.string().trim().min(1).max(300),
  folder: z.string().trim().max(80).default("portfolio"),
  alt: z.string().trim().max(300).optional(),
});

/**
 * Finalises an upload: the provider is re-read server-side so a client
 * cannot spoof dimensions or URLs.
 */
export async function POST(request: Request) {
  try {
    await requireOwner();
  } catch (error) {
    const status =
      error instanceof Error && "status" in error ? Number(error.status) : 401;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not authorised" },
      { status: status === 403 ? 403 : 401 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload payload" }, { status: 422 });
  }

  try {
    const storage = getMediaStorage();
    const asset = await storage.verifyUpload(parsed.data.publicId);

    if (!asset) {
      return NextResponse.json(
        { error: "That upload could not be verified" },
        { status: 404 },
      );
    }

    const repositories = await getRepositories();
    const existing = await repositories.media.getByPublicId(asset.publicId);

    const media = existing
      ? await repositories.media.update(existing.id, {
          url: asset.url,
          secureUrl: asset.secureUrl,
          originalUrl: asset.originalUrl,
          format: asset.format,
          width: asset.width,
          height: asset.height,
          bytes: asset.bytes,
          alt: parsed.data.alt ?? existing.alt,
          folder: parsed.data.folder,
        })
      : await repositories.media.create({
          publicId: asset.publicId,
          provider: storage.provider,
          url: asset.url,
          secureUrl: asset.secureUrl,
          originalUrl: asset.originalUrl,
          format: asset.format,
          width: asset.width,
          height: asset.height,
          bytes: asset.bytes,
          alt: parsed.data.alt,
          folder: parsed.data.folder,
          usedBy: [],
        });

    await recordAudit({
      actorEmail: "owner",
      action: "media.create",
      entity: "media",
      entityId: media?.id,
    });

    return NextResponse.json({ ok: true, media });
  } catch (error) {
    console.error("[media] failed to complete upload:", error);
    return NextResponse.json(
      { error: "Could not finalise the upload" },
      { status: 500 },
    );
  }
}
