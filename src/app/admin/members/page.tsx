import { MembersClient } from "@/components/admin/members/MembersClient";
import { MOCK_ADMIN_MEMBERS, MOCK_SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function AdminMembersPage() {
  // En una aplicación real, estos datos vendrían de una API
  const members = MOCK_ADMIN_MEMBERS;
  const plans = MOCK_SUBSCRIPTION_PLANS;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Gestión de Miembros</h2>
      <MembersClient initialMembers={members} availablePlans={plans} />
    </div>
  );
}
