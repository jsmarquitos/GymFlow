"use client";

import type { MemberProfile } from "@/types";
import { ProfileDetails } from "./ProfileDetails";
import { BookingHistoryTable } from "./BookingHistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

// Mock data for demonstration
const mockProfile: MemberProfile = {
  id: "user123",
  name: "Alex Ryder",
  email: "alex.ryder@example.com",
  membershipType: "Premium Oro",
  joinDate: "15 de enero de 2023",
  profilePictureUrl: "https://placehold.co/150x150.png",
  profilePictureHint: "persona avatar",
  bookings: [
    { id: "b1", classId: "c1", className: "Flujo de Yoga Matutino", classDate: "10 de julio de 2024", classTime: "7:00 AM", status: "Asistida" },
    { id: "b2", classId: "c2", className: "Explosión HIIT", classDate: "11 de julio de 2024", classTime: "6:00 PM", status: "Reservada" },
    { id: "b3", classId: "c3", className: "Hora de Poder en Spin", classDate: "8 de julio de 2024", classTime: "5:30 PM", status: "Cancelada" },
    { id: "b4", classId: "c1", className: "Flujo de Yoga Matutino", classDate: "5 de julio de 2024", classTime: "7:00 AM", status: "Asistida" },
  ],
};


export function ProfileClient() {
  // In a real app, this data would come from an API or state management
  const profile = mockProfile;

  return (
    <div className="space-y-8">
      <ProfileDetails profile={profile} />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <History className="mr-2 h-6 w-6 text-accent" />
            Historial de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BookingHistoryTable bookings={profile.bookings} />
        </CardContent>
      </Card>
    </div>
  );
}
