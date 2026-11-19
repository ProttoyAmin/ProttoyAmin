import { MediaPanel } from "@/client/admin/media-panel";
import { getRepositories, getRuntimeStatus } from "@/server/db/registry";

export const dynamic = "force-dynamic";

export const metadata = { title: "Media" };

/** Admin → Media. */
export default async function AdminMediaPage() {
  const repositories = await getRepositories();
  const media = await repositories.media.list({}, { createdAt: -1 });

  return <MediaPanel data={{ media, runtime: getRuntimeStatus() }} />;
}
