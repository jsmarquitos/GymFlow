
import { RoutineManagementClient } from "@/components/admin/routines-management/RoutineManagementClient";
import { MOCK_ADMIN_MEMBERS } from "@/lib/constants"; // Para el selector de miembros

export default function AdminRoutinesManagementPage() {
  // Los miembros se pasan para poder seleccionarlos al asignar/crear rutinas
  const members = MOCK_ADMIN_MEMBERS; 

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Gestión de Rutinas de Entrenamiento</h2>
      <RoutineManagementClient availableMembers={members} />
    </div>
  );
}
