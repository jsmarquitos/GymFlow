import { ClassesClient } from "@/components/admin/classes/ClassesClient";
import { MOCK_CLASS_SCHEDULES } from "@/lib/constants";

export default function AdminClassesPage() {
  // En una aplicación real, estos datos vendrían de una API
  const classes = MOCK_CLASS_SCHEDULES;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Gestión de Clases</h2>
      <ClassesClient initialClasses={classes} />
    </div>
  );
}
