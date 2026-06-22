import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <h2 className="mb-4 font-bold">站点设置</h2>
      <SettingsForm
        initialContacts={settings.contacts}
        initialQrUrl={settings.qrUrl}
        initialInstruction={settings.instruction}
      />
    </div>
  );
}
