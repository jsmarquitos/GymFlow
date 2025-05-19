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
        <p className="text-muted-foreground">No booking history found.</p>
        <p className="text-sm text-muted-foreground">Start booking classes to see your history here!</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>A list of your recent class bookings.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Class Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-right">Status</TableHead>
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
                  booking.status === "Attended" ? "default" :
                  booking.status === "Booked" ? "secondary" :
                  "destructive"
                }
                className={cn(
                  booking.status === 'Attended' && 'bg-green-600/80 text-white',
                  booking.status === 'Booked' && 'bg-blue-500/80 text-white',
                  booking.status === 'Cancelled' && 'bg-red-600/80 text-white'
                )}
              >
                {booking.status === 'Attended' && <CheckCircle className="mr-1 h-3 w-3" />}
                {booking.status === 'Cancelled' && <XCircle className="mr-1 h-3 w-3" />}
                {booking.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
