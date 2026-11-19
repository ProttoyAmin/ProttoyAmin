import { SettingsPage } from "../settings-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Password & security" };

export default function SecuritySettingsPage() {
  return <SettingsPage section="security" />;
}
