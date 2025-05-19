import { PaymentsClient } from "@/components/admin/payments/PaymentsClient";
import { MOCK_PAYMENT_RECORDS, MOCK_ADMIN_MEMBERS } from "@/lib/constants";

export default function AdminPaymentsPage() {
  // En una aplicación real, estos datos vendrían de una API
  const payments = MOCK_PAYMENT_RECORDS;
  const members = MOCK_ADMIN_MEMBERS;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Gestión de Pagos</h2>
      <PaymentsClient initialPayments={payments} members={members} />
    </div>
  );
}
