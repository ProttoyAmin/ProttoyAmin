import { NextResponse } from "next/server";

import { readLocalFile } from "@/server/media/local";

/**
 * Serves images uploaded through the local media driver.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const publicId = path.join("/");
  const file = await readLocalFile(publicId);

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentType =
    file.meta.format === "png"
      ? "image/png"
      : file.meta.format === "webp"
        ? "image/webp"
        : file.meta.format === "avif"
          ? "image/avif"
          : file.meta.format === "gif"
            ? "image/gif"
            : "image/jpeg";

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(file.buffer.byteLength),
    },
  });
}
