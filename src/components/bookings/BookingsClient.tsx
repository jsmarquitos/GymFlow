
"use client";

import { useState } from "react";
import type { MemberBooking } from "@/types";
import { MOCK_MEMBER_BOOKINGS } from "@/lib/constants";
import { BookingHistoryTable } from "@/components/profile/BookingHistoryTable"; // Reutilizando
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, PlusCircle } from "lucide-react";
import Link from "next/link";

export function BookingsClient() {
  // En una aplicación real, estos datos vendrían de una API o del estado del usuario
  const [bookings, setBookings] = useState<MemberBooking[]>(MOCK_MEMBER_BOOKINGS);

  // Función para cancelar una reserva (simulada por ahora)
  const handleCancelBooking = (bookingId: string) => {
    setBookings(prevBookings =>
      prevBookings.map(b =>
        b.id === bookingId && b.status === "Reservada" ? { ...b, status: "Cancelada" } : b
      )
    );
    // Aquí iría una llamada a la API para cancelar la reserva
    console.log(`Reserva ${bookingId} cancelada (simulado)`);
  };
  
  const upcomingBookings = bookings.filter(b => b.status === "Reservada");
  const pastBookings = bookings.filter(b => b.status !== "Reservada");


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center text-2xl">
              <Ticket className="mr-2 h-6 w-6 text-primary" />
              Mis Reservas
            </CardTitle>
            <Button asChild size="sm">
              <Link href="/schedule">
                <PlusCircle className="mr-2 h-4 w-4" />
                Reservar Nueva Clase
              </Link>
            </Button>
          </div>
          <CardDescription>
            Aquí puedes ver tus próximas clases y tu historial de reservas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {bookings.length > 0 ? (
            <>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Próximas Clases</h3>
                {upcomingBookings.length > 0 ? (
                  <BookingHistoryTable bookings={upcomingBookings} />
                ) : (
                  <p className="text-muted-foreground">No tienes clases próximas reservadas.</p>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Historial de Clases</h3>
                 {pastBookings.length > 0 ? (
                  <BookingHistoryTable bookings={pastBookings} />
                ) : (
                  <p className="text-muted-foreground">No tienes historial de clases pasadas.</p>
                )}
              </div>
            </>
          ) : (
             <div className="mt-6 p-6 border border-dashed border-border rounded-md text-center">
                <p className="text-lg font-semibold">¡Aún no tienes reservas!</p>
                <p className="text-sm text-muted-foreground">Explora nuestro <Link href="/schedule" className="text-primary hover:underline">horario de clases</Link> y reserva tu primera actividad.</p>
            </div>
          )}
        </CardContent>
         {bookings.length > 0 && (
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Para cancelar una reserva próxima, por favor contacta con recepción o utiliza la opción (próximamente disponible) en cada reserva.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
