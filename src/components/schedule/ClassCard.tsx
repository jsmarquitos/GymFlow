"use client";

import Image from "next/image";
import type { ClassSchedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Clock, CalendarDays, Dumbbell, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
}

export function ClassCard({ classInfo }: ClassCardProps) {
  const { toast } = useToast();
  const IconComponent = classInfo.icon || Dumbbell;

  const handleBooking = () => {
    // Placeholder for booking logic
    toast({
      title: "Booking Initiated",
      description: `You've started booking ${classInfo.name}.`,
      variant: "default",
    });
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
            data-ai-hint={classInfo.imageHint || "fitness class"}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <IconComponent className="mr-2 h-6 w-6 text-primary" />
          {classInfo.name}
        </CardTitle>
        <CardDescription>
          Taught by: {classInfo.instructor}
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
          <span>{classInfo.availableSlots} / {classInfo.totalSlots} spots available</span>
        </div>
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="link" size="sm" className="p-0 h-auto text-accent hover:text-accent/80">
              <Info className="mr-1 h-4 w-4" /> View Description
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{classInfo.name} - Description</AlertDialogTitle>
              <AlertDialogDescription className="max-h-60 overflow-y-auto py-2">
                {classInfo.description || "No description available for this class."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleBooking} 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={classInfo.availableSlots === 0}
        >
          {classInfo.availableSlots === 0 ? "Fully Booked" : "Book Class"}
        </Button>
      </CardFooter>
    </Card>
  );
}
