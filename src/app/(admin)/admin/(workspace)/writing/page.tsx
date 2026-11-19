import { WritingPanel } from "@/client/admin/writing-panel";
import { getRepositories } from "@/server/db/registry";

export const dynamic = "force-dynamic";

export const metadata = { title: "Writing" };

/** Admin → Writing. */
export default async function AdminWritingPage() {
  const repositories = await getRepositories();

  const [posts, media] = await Promise.all([
    repositories.posts.list({}, { createdAt: -1 }),
    repositories.media.list({}, { createdAt: -1 }),
  ]);

  const real = posts.filter((item) => !item.isDummy);

  return (
    <WritingPanel data={{ posts: real.length > 0 ? real : posts, media }} />
  );
}
