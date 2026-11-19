import { SettingsPage } from "./settings-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "General settings" };

export default function AdminSettingsPage() {
  return <SettingsPage section="general" />;
}
