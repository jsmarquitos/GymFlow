import { SubscriptionPlansClient } from "@/components/admin/subscriptions/SubscriptionPlansClient";
import { MOCK_SUBSCRIPTION_PLANS } from "@/lib/constants";

export default function AdminSubscriptionsPage() {
  // En una aplicación real, estos datos vendrían de una API
  const plans = MOCK_SUBSCRIPTION_PLANS;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Gestión de Planes de Suscripción</h2>
      <SubscriptionPlansClient initialPlans={plans} />
    </div>
  );
}
