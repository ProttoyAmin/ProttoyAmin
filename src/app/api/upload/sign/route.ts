import { NextResponse } from "next/server";

import { requireOwner } from "@/server/auth/owner";
import { getMediaStorage } from "@/server/media";
import { CLOUDINARY_FOLDER, MEDIA_FOLDERS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    await requireOwner();
  } catch (error) {
    const status = error instanceof Error && "status" in error ? Number(error.status) : 401;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not authorised" },
      { status: status === 403 ? 403 : 401 },
    );
  }

  let folder = CLOUDINARY_FOLDER;
  try {
    const body = (await request.json()) as { folder?: string };
    if (body.folder && (MEDIA_FOLDERS as readonly string[]).includes(body.folder)) {
      folder = body.folder;
    }
  } catch {
    // Body is optional.
  }

  try {
    const storage = getMediaStorage();
    const signed = await storage.signUpload(folder);
    return NextResponse.json(signed);
  } catch (error) {
    console.error("[media] failed to sign upload:", error);
    return NextResponse.json(
      { error: "Could not prepare the upload. Check the media credentials." },
      { status: 500 },
    );
  }
}
