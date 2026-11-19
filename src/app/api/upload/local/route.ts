import { NextResponse } from "next/server";

import { requireOwner } from "@/server/auth/owner";
import { saveLocalFile, verifyLocalUploadToken } from "@/server/media/local";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

/**
 * Receives a file upload for the local (no-cloud-credentials) media driver.
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

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") ?? "portfolio");
    const expiresAt = Number(form.get("expiresAt") ?? 0);
    const token = String(form.get("token") ?? "");

    if (!verifyLocalUploadToken(folder, expiresAt, token)) {
      return NextResponse.json({ error: "Upload token is invalid or expired" }, { status: 403 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Images must be 10 MB or smaller" },
        { status: 413 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported" }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await saveLocalFile(buffer, folder, file.name);

    return NextResponse.json({
      publicId: meta.publicId,
      format: meta.format,
      width: meta.width,
      height: meta.height,
      bytes: meta.bytes,
    });
  } catch (error) {
    console.error("[media] local upload failed:", error);
    return NextResponse.json(
      { error: "The upload failed. Please try a different image." },
      { status: 500 },
    );
  }
}
