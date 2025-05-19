
import { SettingsClient } from "@/components/admin/settings/SettingsClient";
// MOCK_GYM_SETTINGS is no longer needed here as SettingsClient will get it from context

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Configuración General del Gimnasio</h2>
      <SettingsClient /> {/* No longer pass initialSettings */}
    </div>
  );
}
