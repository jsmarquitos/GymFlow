import { BookingsClient } from "@/components/bookings/BookingsClient";

export default function BookingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Gestión de Reservas</h1>
      <BookingsClient />
    </div>
  );
}
