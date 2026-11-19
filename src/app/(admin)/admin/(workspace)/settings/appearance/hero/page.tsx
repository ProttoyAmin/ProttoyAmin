import { SettingsPage } from "../../settings-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Appearance · Hero" };

export default function HeroSettingsPage() {
  return <SettingsPage section="hero" />;
}
