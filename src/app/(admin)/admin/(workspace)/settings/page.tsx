import { SettingsPanel } from "@/client/admin/settings-panel";
import { getOwnerContext } from "@/server/auth/owner";
import { getRepositories } from "@/server/db/registry";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

/** Admin → Settings. */
export default async function AdminSettingsPage() {
  const context = await getOwnerContext();

  if ("error" in context) {
    // The workspace layout already renders the access-denied screen; this
    // branch only guards the type checker.
    return null;
  }

  const repositories = await getRepositories();
  const media = await repositories.media.list({}, { createdAt: -1 });

  return (
    <SettingsPanel
      data={{
        settings: context.settings,
        owner: context.user,
        media,
      }}
    />
  );
}
