
"use client";

import { ClassCard } from "./ClassCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { MOCK_CLASS_SCHEDULES } from "@/lib/constants"; // Importar desde constants

const dayOptions = [
  { value: "all", label: "Todos los Días" },
  { value: "lun", label: "Lunes" },
  { value: "mar", label: "Martes" },
  { value: "mié", label: "Miércoles" }, // Abreviaturas consistentes con lo que pueda buscar el usuario
  { value: "jue", label: "Jueves" },
  { value: "vie", label: "Viernes" },
  { value: "sáb", label: "Sábado" },
  { value: "dom", label: "Domingo" },
];

export function ScheduleView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDay, setFilterDay] = useState("all"); 
  const [filterTime, setFilterTime] = useState("all"); 
  
  // En una app real, las clases vendrían de una API o estado global.
  // Por ahora, usamos los datos mock de constants.
  const classes = MOCK_CLASS_SCHEDULES;


  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const nameMatch = cls.name.toLowerCase().includes(searchTerm.toLowerCase());
      const instructorMatch = cls.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Mejoramos la lógica del día para que sea más flexible
      const dayMatch = filterDay === "all" || 
        cls.time.toLowerCase().split(/[,-]/).some(part => part.trim().startsWith(filterDay.toLowerCase()));
      
      const timeParts = cls.time.split(" - ")[1]?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      let classHour = -1;
      if (timeParts) {
        classHour = parseInt(timeParts[1]);
        const period = timeParts[3]?.toUpperCase();
        if (period === "PM" && classHour !== 12) classHour += 12;
        if (period === "AM" && classHour === 12) classHour = 0; // Medianoche
      }
      
      const timeOfDayMatch = filterTime === "all" ||
        (filterTime === "morning" && classHour >= 5 && classHour < 12) ||
        (filterTime === "afternoon" && classHour >= 12 && classHour < 18) ||
        (filterTime === "evening" && classHour >= 18 && classHour < 24);

      return (nameMatch || instructorMatch) && dayMatch && timeOfDayMatch;
    });
  }, [searchTerm, filterDay, filterTime, classes]);

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
            <ClassCard key={classInfo.id} classInfo={classInfo} />
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
