
"use client";

import Image from "next/image";
import type { ClassSchedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Clock, CalendarDays, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getIconComponent } from "@/lib/icons";
import { MOCK_MEMBER_BOOKINGS } from "@/lib/constants"; // Import mock bookings
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClassCardProps {
  classInfo: ClassSchedule;
  onBookClass: (classId: string) => void;
}

export function ClassCard({ classInfo, onBookClass }: ClassCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const IconComponent = getIconComponent(classInfo.iconName);

  // Check if the current user (simulated) has already booked this class and it's active
  const isAlreadyBookedByCurrentUser = user && user.role === 'member' ? MOCK_MEMBER_BOOKINGS.some(
    (booking) => booking.classId === classInfo.id && booking.status === "Reservada"
    // In a real app, you'd check against the actual current user's ID and their active bookings
  ) : false;

  const handleBooking = () => {
    if (!user) {
      toast({
        title: "Acción Requerida",
        description: "Debes iniciar sesión como miembro para reservar una clase.",
        variant: "destructive",
      });
      return;
    }

    if (user.role === 'admin') {
      toast({
        title: "Función no disponible",
        description: "Los administradores no pueden reservar clases.",
        variant: "destructive",
      });
      return;
    }

    if (isAlreadyBookedByCurrentUser) {
      toast({
        title: "Clase Ya Reservada",
        description: "Ya tienes una reserva activa para esta clase.",
        variant: "default", // Changed from destructive to default/info
      });
      return;
    }

    if (classInfo.availableSlots > 0) {
      onBookClass(classInfo.id);
      toast({
        title: "Reserva Iniciada",
        description: `Has comenzado a reservar ${classInfo.name}. Revisa "Mis Reservas" para confirmar.`,
        variant: "default",
      });
      // Note: To make 'isAlreadyBookedByCurrentUser' reflect this new booking immediately
      // without page reload, MOCK_MEMBER_BOOKINGS would need to be part of a mutable state (e.g., Context).
      // For now, this handles re-booking based on the initial state of MOCK_MEMBER_BOOKINGS.
    } else {
      toast({
        title: "Clase Completa",
        description: "No quedan cupos disponibles para esta clase.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {classInfo.imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={classInfo.imageUrl}
            alt={classInfo.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={classInfo.imageHint || "clase fitness"}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <IconComponent className="mr-2 h-6 w-6 text-primary" />
          {classInfo.name}
        </CardTitle>
        <CardDescription>
          Impartida por: {classInfo.instructor}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="mr-2 h-4 w-4" />
          <span>{classInfo.time}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          <span>{classInfo.duration}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          <span>{classInfo.availableSlots} / {classInfo.totalSlots} cupos disponibles</span>
        </div>
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="link" size="sm" className="p-0 h-auto text-accent hover:text-accent/80">
              <Info className="mr-1 h-4 w-4" /> Ver Descripción
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{classInfo.name} - Descripción</AlertDialogTitle>
              <AlertDialogDescription className="max-h-60 overflow-y-auto py-2">
                {classInfo.description || "No hay descripción disponible para esta clase."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cerrar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleBooking}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={classInfo.availableSlots === 0 || isAlreadyBookedByCurrentUser}
        >
          {isAlreadyBookedByCurrentUser
            ? "Ya Reservada"
            : classInfo.availableSlots === 0
            ? "Completo"
            : "Reservar Clase"}
        </Button>
      </CardFooter>
    </Card>
  );
}
