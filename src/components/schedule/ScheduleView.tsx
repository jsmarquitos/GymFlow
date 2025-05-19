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
    name: "Flujo de Yoga Matutino",
    instructor: "Sarah Lee",
    time: "Lun, Mié, Vie - 7:00 AM",
    duration: "60 minutos",
    availableSlots: 15,
    totalSlots: 20,
    description: "Comienza tu día con una vigorizante sesión de yoga diseñada para despertar tu cuerpo y mente. Apta para todos los niveles.",
    icon: Zap, 
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "clase yoga"
  },
  {
    id: "2",
    name: "Explosión HIIT",
    instructor: "Mike Ross",
    time: "Mar, Jue - 6:00 PM",
    duration: "45 minutos",
    availableSlots: 5,
    totalSlots: 15,
    description: "Entrenamiento de Intervalos de Alta Intensidad para llevar tus límites al máximo y quemar calorías. ¡Prepárate para sudar!",
    icon: Dumbbell,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "entrenamiento HIIT"
  },
  {
    id: "3",
    name: "Hora de Poder en Spin",
    instructor: "Jessica Chen",
    time: "Lun, Mié - 5:30 PM",
    duration: "60 minutos",
    availableSlots: 0,
    totalSlots: 25,
    description: "Una clase energética de ciclismo indoor con música animada y terrenos desafiantes. ¡Pedalea hacia tu bienestar!",
    icon: Bike,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "clase spin"
  },
  {
    id: "4",
    name: "Fitness Acuático",
    instructor: "David Kim",
    time: "Sáb - 10:00 AM",
    duration: "50 minutos",
    availableSlots: 12,
    totalSlots: 15,
    description: "Entrenamiento acuático de bajo impacto y alta resistencia. Perfecto para todos los niveles de fitness y suave para las articulaciones.",
    icon: Waves,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "fitness acuatico"
  },
   {
    id: "5",
    name: "Entrenamiento de Fuerza 101",
    instructor: "Alex Johnson",
    time: "Mar, Jue - 7:00 AM",
    duration: "75 minutos",
    availableSlots: 8,
    totalSlots: 12,
    description: "Aprende los fundamentos del entrenamiento de fuerza, enfocándote en la forma y técnica correctas para los principales levantamientos.",
    icon: Dumbbell,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "gimnasio pesas"
  },
  {
    id: "6",
    name: "Fiesta de Baile Zumba",
    instructor: "Maria Rodriguez",
    time: "Vie - 7:00 PM",
    duration: "60 minutos",
    availableSlots: 20,
    totalSlots: 30,
    description: "Baila hacia el fitness con esta divertida y energética clase de Zumba. ¡No se requiere experiencia en baile!",
    icon: Zap,
    imageUrl: "https://placehold.co/600x400.png",
    imageHint: "baile zumba"
  },
];

const dayOptions = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mié" },
  { value: "thu", label: "Jue" },
  { value: "fri", label: "Vie" },
  { value: "sat", label: "Sáb" },
  { value: "sun", label: "Dom" },
];

export function ScheduleView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDay, setFilterDay] = useState("all"); 
  const [filterTime, setFilterTime] = useState("all"); 

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
          placeholder="Buscar clases o instructores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <div className="flex gap-4">
          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por día" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Días</SelectItem>
              {dayOptions.map(day => (
                <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por hora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Horas</SelectItem>
              <SelectItem value="morning">Mañana (5am-12pm)</SelectItem>
              <SelectItem value="afternoon">Tarde (12pm-6pm)</SelectItem>
              <SelectItem value="evening">Noche (6pm-12am)</SelectItem>
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
          <p className="text-xl text-muted-foreground">Ninguna clase coincide con tus filtros.</p>
        </div>
      )}
    </div>
  );
}
