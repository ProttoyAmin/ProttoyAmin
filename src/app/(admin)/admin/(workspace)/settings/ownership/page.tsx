import { SettingsPage } from "../settings-page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ownership" };

export default function OwnershipSettingsPage() {
  return <SettingsPage section="ownership" />;
}
