"use client";

import type { ClassSchedule } from "@/types";
import { ClassCard } from "./ClassCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Dumbbell, Bike, Waves, Zap } from "lucide-react"; // Zap for generic "Activity"

const mockClasses: ClassSchedule[] = [
  {
    id: "1",
    name: "Morning Yoga Flow",
    instructor: "Sarah Lee",
    time: "Mon, Wed, Fri - 7:00 AM",
    duration: "60 minutes",
    availableSlots: 15,
    totalSlots: 20,
    description: "Start your day with an invigorating yoga session designed to awaken your body and mind. Suitable for all levels.",
    icon: Zap, // Using Zap as a placeholder, could be specific yoga icon
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "yoga class"
  },
  {
    id: "2",
    name: "HIIT Blast",
    instructor: "Mike Ross",
    time: "Tue, Thu - 6:00 PM",
    duration: "45 minutes",
    availableSlots: 5,
    totalSlots: 15,
    description: "High-Intensity Interval Training to push your limits and burn maximum calories. Get ready to sweat!",
    icon: Dumbbell,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "HIIT workout"
  },
  {
    id: "3",
    name: "Spin Power Hour",
    instructor: "Jessica Chen",
    time: "Mon, Wed - 5:30 PM",
    duration: "60 minutes",
    availableSlots: 0,
    totalSlots: 25,
    description: "An energetic indoor cycling class with upbeat music and challenging terrains. Pedal your way to fitness!",
    icon: Bike,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "spin class"
  },
  {
    id: "4",
    name: "Aqua Fitness",
    instructor: "David Kim",
    time: "Sat - 10:00 AM",
    duration: "50 minutes",
    availableSlots: 12,
    totalSlots: 15,
    description: "Low-impact, high-resistance water workout. Perfect for all fitness levels and gentle on the joints.",
    icon: Waves,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "aqua fitness"
  },
   {
    id: "5",
    name: "Strength Training 101",
    instructor: "Alex Johnson",
    time: "Tue, Thu - 7:00 AM",
    duration: "75 minutes",
    availableSlots: 8,
    totalSlots: 12,
    description: "Learn the fundamentals of strength training, focusing on proper form and technique for major lifts.",
    icon: Dumbbell,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "weightlifting gym"
  },
  {
    id: "6",
    name: "Zumba Dance Party",
    instructor: "Maria Rodriguez",
    time: "Fri - 7:00 PM",
    duration: "60 minutes",
    availableSlots: 20,
    totalSlots: 30,
    description: "Dance your way to fitness with this fun and energetic Zumba class. No dance experience required!",
    icon: Zap,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "zumba dance"
  },
];

export function ScheduleView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDay, setFilterDay] = useState("all"); // e.g., "all", "mon", "tue"
  const [filterTime, setFilterTime] = useState("all"); // e.g., "all", "morning", "afternoon", "evening"

  const classDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const filteredClasses = useMemo(() => {
    return mockClasses.filter(cls => {
      const nameMatch = cls.name.toLowerCase().includes(searchTerm.toLowerCase());
      const instructorMatch = cls.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const dayMatch = filterDay === "all" || cls.time.toLowerCase().includes(filterDay.toLowerCase());
      
      const timeParts = cls.time.split(" - ")[1]?.split(" ")[0]?.split(":");
      let classHour = -1;
      if (timeParts && timeParts.length > 0) {
        classHour = parseInt(timeParts[0]);
        if (cls.time.toLowerCase().includes("pm") && classHour !== 12) classHour += 12;
        if (cls.time.toLowerCase().includes("am") && classHour === 12) classHour = 0; // Midnight
      }
      
      const timeOfDayMatch = filterTime === "all" ||
        (filterTime === "morning" && classHour >= 5 && classHour < 12) ||
        (filterTime === "afternoon" && classHour >= 12 && classHour < 18) ||
        (filterTime === "evening" && classHour >= 18 && classHour < 24);

      return (nameMatch || instructorMatch) && dayMatch && timeOfDayMatch;
    });
  }, [searchTerm, filterDay, filterTime]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg shadow">
        <Input
          type="text"
          placeholder="Search classes or instructors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <div className="flex gap-4">
          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {classDays.map(day => (
                <SelectItem key={day} value={day.toLowerCase()}>{day}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Times</SelectItem>
              <SelectItem value="morning">Morning (5am-12pm)</SelectItem>
              <SelectItem value="afternoon">Afternoon (12pm-6pm)</SelectItem>
              <SelectItem value="evening">Evening (6pm-12am)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classInfo) => (
            <ClassCard key={classInfo.id} classInfo={classInfo} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No classes match your filters.</p>
        </div>
      )}
    </div>
  );
}
