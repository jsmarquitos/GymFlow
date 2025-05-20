
import { InstructorsClient } from "@/components/admin/instructors/InstructorsClient";

export default function AdminInstructorsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Gestión de Instructores</h2>
      <InstructorsClient />
    </div>
  );
}
