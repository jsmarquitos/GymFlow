
"use client";

import { ClassCard } from "./ClassCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import type { ClassSchedule } from "@/types";
import { useClassSchedules } from "@/hooks/useClassSchedules"; // Import context hook
import { Loader2, Search } from "lucide-react"; // Import Search icon

const dayOptions = [
  { value: "all", label: "Todos los Días" },
  { value: "lun", label: "Lunes" },
  { value: "mar", label: "Martes" },
  { value: "mié", label: "Miércoles" },
  { value: "jue", label: "Jueves" },
  { value: "vie", label: "Viernes" },
  { value: "sáb", label: "Sábado" },
  { value: "dom", label: "Domingo" },
];

export function ScheduleView() {
  const { classes: classesFromContext, isLoading: isLoadingContext, updateClassSlots } = useClassSchedules();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDay, setFilterDay] = useState("all"); 
  const [filterTime, setFilterTime] = useState("all"); 
  
  const [displayClasses, setDisplayClasses] = useState<ClassSchedule[]>([]);

  useEffect(() => {
    if (!isLoadingContext) {
      setDisplayClasses(classesFromContext);
    }
  }, [classesFromContext, isLoadingContext]);

  const handleClassBooked = (classId: string) => {
    const classToBookLocally = displayClasses.find(c => c.id === classId);

    if (classToBookLocally && classToBookLocally.availableSlots > 0) {
      const newLocalAvailableSlots = classToBookLocally.availableSlots - 1;
      
      // Update the local state for immediate UI feedback
      setDisplayClasses(prevDisplayClasses =>
        prevDisplayClasses.map(cls =>
          cls.id === classId
            ? { ...cls, availableSlots: newLocalAvailableSlots }
            : cls
        )
      );
      // Then, update the context state for persistence and global consistency
      updateClassSlots(classId, newLocalAvailableSlots);
    }
  };

  const filteredClasses = useMemo(() => {
    return displayClasses.filter(cls => {
      const nameMatch = cls.name.toLowerCase().includes(searchTerm.toLowerCase());
      const instructorMatch = cls.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const dayMatch = filterDay === "all" || 
        cls.time.toLowerCase().split(/[,-]/).some(part => part.trim().startsWith(filterDay.toLowerCase()));
      
      const timeParts = cls.time.split(" - ")[1]?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      let classHour = -1;
      if (timeParts) {
        classHour = parseInt(timeParts[1]);
        const period = timeParts[3]?.toUpperCase();
        if (period === "PM" && classHour !== 12) classHour += 12;
        if (period === "AM" && classHour === 12) classHour = 0; 
      }
      
      const timeOfDayMatch = filterTime === "all" ||
        (filterTime === "morning" && classHour >= 5 && classHour < 12) ||
        (filterTime === "afternoon" && classHour >= 12 && classHour < 18) ||
        (filterTime === "evening" && classHour >= 18 && classHour < 24);

      return (nameMatch || instructorMatch) && dayMatch && timeOfDayMatch;
    });
  }, [searchTerm, filterDay, filterTime, displayClasses]);

  if (isLoadingContext) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Cargando horarios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg shadow">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar clases o instructores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10" // Add padding to the left for the icon
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por día" />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map(day => (
                <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTime} onValueChange={setFilterTime}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            <ClassCard 
              key={classInfo.id} 
              classInfo={classInfo} 
              onBookClass={handleClassBooked} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">Ninguna clase coincide con tus filtros.</p>
          <p className="text-sm text-muted-foreground">Intenta ajustar tu búsqueda o filtros.</p>
        </div>
      )}
    </div>
  );
}
