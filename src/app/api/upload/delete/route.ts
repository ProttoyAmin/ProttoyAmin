import { NextResponse } from "next/server";
import { z } from "zod";

import { requireOwner } from "@/server/auth/owner";
import { getRepositories } from "@/server/db/registry";
import { getMediaStorage } from "@/server/media";
import { recordAudit } from "@/server/services/audit.service";

const bodySchema = z.object({ publicId: z.string().trim().min(1).max(300) });

export async function POST(request: Request) {
  let owner: Awaited<ReturnType<typeof requireOwner>>;
  try {
    owner = await requireOwner();
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
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  try {
    const repositories = await getRepositories();
    const asset = await repositories.media.getByPublicId(parsed.data.publicId);

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.usedBy.length > 0) {
      return NextResponse.json(
        {
          error: `This asset is used by ${asset.usedBy.length} item(s). Remove it there first.`,
        },
        { status: 409 },
      );
    }

    const storage = getMediaStorage();
    await storage.remove(asset.publicId);
    await repositories.media.remove(asset.id);

    await recordAudit({
      actorEmail: owner.user.email,
      action: "media.delete",
      entity: "media",
      entityId: asset.id,
      metadata: { publicId: asset.publicId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[media] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the asset" }, { status: 500 });
  }
}
