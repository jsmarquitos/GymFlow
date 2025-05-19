import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export default function BookingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Mis Reservas</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ticket className="mr-2 h-6 w-6 text-accent" />
            Próximas y Pasadas Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta sección mostrará tu historial de reservas de clases y tus próximas reservas.
            La funcionalidad para gestionar tus reservas estará disponible aquí.
          </p>
          <div className="mt-6 p-6 border border-dashed border-border rounded-md text-center">
            <p className="text-lg font-semibold">¡Gestión de Reservas Próximamente!</p>
            <p className="text-sm text-muted-foreground">Vuelve más tarde para ver tus clases reservadas.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
