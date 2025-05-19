"use client";

import type { MemberBooking } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Ticket, CheckCircle, XCircle, CalendarClock } from "lucide-react";

interface BookingHistoryTableProps {
  bookings: MemberBooking[];
}

export function BookingHistoryTable({ bookings }: BookingHistoryTableProps) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No se encontró historial de reservas.</p>
        <p className="text-sm text-muted-foreground">¡Empieza a reservar clases para ver tu historial aquí!</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>Una lista de tus reservas de clases recientes.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Nombre de la Clase</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Hora</TableHead>
          <TableHead className="text-right">Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium flex items-center">
              <Ticket className="mr-2 h-4 w-4 text-primary" />
              {booking.className}
            </TableCell>
            <TableCell>{booking.classDate}</TableCell>
            <TableCell>{booking.classTime}</TableCell>
            <TableCell className="text-right">
              <Badge
                variant={
                  booking.status === "Asistida" ? "default" :
                  booking.status === "Reservada" ? "secondary" :
                  "destructive"
                }
                className={cn(
                  booking.status === 'Asistida' && 'bg-green-600/80 text-white',
                  booking.status === 'Reservada' && 'bg-blue-500/80 text-white',
                  booking.status === 'Cancelada' && 'bg-red-600/80 text-white'
                )}
              >
                {booking.status === 'Asistida' && <CheckCircle className="mr-1 h-3 w-3" />}
                {booking.status === 'Cancelada' && <XCircle className="mr-1 h-3 w-3" />}
                {booking.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
