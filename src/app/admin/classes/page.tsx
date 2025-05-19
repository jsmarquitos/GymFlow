
import { ClassesClient } from "@/components/admin/classes/ClassesClient";
// MOCK_CLASS_SCHEDULES is no longer needed here as ClassesClient will get it from context

export default function AdminClassesPage() {
  // En una aplicación real, estos datos vendrían de una API
  // const classes = MOCK_CLASS_SCHEDULES; // Removed

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Gestión de Clases</h2>
      <ClassesClient /> {/* No longer pass initialClasses */}
    </div>
  );
}
