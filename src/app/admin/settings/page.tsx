import { SettingsClient } from "@/components/admin/settings/SettingsClient";
import { MOCK_GYM_SETTINGS } from "@/lib/constants";

export default function AdminSettingsPage() {
  // En una aplicación real, estos datos vendrían de una API
  const initialSettings = MOCK_GYM_SETTINGS;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Configuración General del Gimnasio</h2>
      <SettingsClient initialSettings={initialSettings} />
    </div>
  );
}
