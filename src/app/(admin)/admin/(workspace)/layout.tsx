import { AdminShell } from "@/client/admin/shell";
import { getOwnerContext } from "@/server/auth/owner";
import { getRepositories } from "@/server/db/registry";
import { AccessDenied } from "@/app/(admin)/admin/access-denied";

export const dynamic = "force-dynamic";

/**
 * The admin workspace.
 *
 * Every section is its own route (`/admin`, `/admin/projects`, …). This
 * layout owns the chrome and the ownership gate; the pages below only load
 * the data they need.
 */
export default async function AdminWorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getOwnerContext();

  if ("error" in context) {
    return <AccessDenied message={context.message} />;
  }

  const repositories = await getRepositories();
  const messages = await repositories.messages.list({}, { createdAt: -1 });
  const unread = messages.filter((message) => !message.read).length;

  return (
    <AdminShell owner={context.user} unread={unread}>
      {children}
    </AdminShell>
  );
}
