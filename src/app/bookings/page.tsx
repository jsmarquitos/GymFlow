import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export default function BookingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">My Bookings</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ticket className="mr-2 h-6 w-6 text-accent" />
            Upcoming & Past Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will display your class booking history and upcoming reservations.
            Functionality to manage your bookings will be available here.
          </p>
          <div className="mt-6 p-6 border border-dashed border-border rounded-md text-center">
            <p className="text-lg font-semibold">Booking Management Coming Soon!</p>
            <p className="text-sm text-muted-foreground">Check back later to see your booked classes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
