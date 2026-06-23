import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">设置</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">客服联系方式和基础提示。</p>
      </div>
      <SettingsForm
        initialContacts={settings.contacts}
        initialQrUrl={settings.qrUrl}
        initialInstruction={settings.instruction}
      />
    </div>
  );
}
