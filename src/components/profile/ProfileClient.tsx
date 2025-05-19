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
  membershipType: "Premium Gold",
  joinDate: "January 15, 2023",
  profilePictureUrl: "https://placehold.co/150x150.png",
  profilePictureHint: "person avatar",
  bookings: [
    { id: "b1", classId: "c1", className: "Morning Yoga Flow", classDate: "July 10, 2024", classTime: "7:00 AM", status: "Attended" },
    { id: "b2", classId: "c2", className: "HIIT Blast", classDate: "July 11, 2024", classTime: "6:00 PM", status: "Booked" },
    { id: "b3", classId: "c3", className: "Spin Power Hour", classDate: "July 8, 2024", classTime: "5:30 PM", status: "Cancelled" },
    { id: "b4", classId: "c1", className: "Morning Yoga Flow", classDate: "July 5, 2024", classTime: "7:00 AM", status: "Attended" },
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
            Booking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BookingHistoryTable bookings={profile.bookings} />
        </CardContent>
      </Card>
    </div>
  );
}
