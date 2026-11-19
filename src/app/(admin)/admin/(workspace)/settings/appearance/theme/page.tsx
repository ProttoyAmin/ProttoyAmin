import { SettingsPage } from "../../settings-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Appearance · Theme" };

export default function ThemeSettingsPage() {
  return <SettingsPage section="theme" />;
}
