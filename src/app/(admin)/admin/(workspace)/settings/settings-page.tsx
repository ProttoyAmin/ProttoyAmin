import { SettingsPanel, type SettingsSection } from "@/client/admin/settings-panel";
import { getOwnerContext } from "@/server/auth/owner";
import { getRepositories } from "@/server/db/registry";

export async function SettingsPage({ section }: { section: SettingsSection }) {
  const context = await getOwnerContext();
  if ("error" in context) return null;
  const repositories = await getRepositories();
  const media =
    section === "hero" ? await repositories.media.list({}, { createdAt: -1 }) : [];
  return (
    <SettingsPanel
      section={section}
      data={{ settings: context.settings, owner: context.user, media }}
    />
  );
}
