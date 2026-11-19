import { MessagesPanel } from "@/client/admin/messages-panel";
import { getRepositories } from "@/server/db/registry";

export const dynamic = "force-dynamic";

export const metadata = { title: "Messages" };

/** Admin → Messages. */
export default async function AdminMessagesPage() {
  const repositories = await getRepositories();
  const messages = await repositories.messages.list({}, { createdAt: -1 });

  return <MessagesPanel data={{ messages }} />;
}
