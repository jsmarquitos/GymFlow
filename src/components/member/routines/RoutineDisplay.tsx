
"use client";

import type { Routine, RoutineDay, RoutineExercise } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CalendarDays, Dumbbell, Info, Edit } from "lucide-react"; // Added Edit
import { Badge } from "@/components/ui/badge";

interface RoutineDisplayProps {
  routine: Routine;
  days: RoutineDay[];
  exercises: RoutineExercise[];
}

export function RoutineDisplay({ routine, days, exercises }: RoutineDisplayProps) {
  return (
    <Card className="shadow-xl border border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div>
            <CardTitle className="text-2xl text-primary flex items-center">
              <Dumbbell className="mr-3 h-7 w-7" />
              {routine.name}
            </CardTitle>
            <CardDescription className="mt-1">
              Asignada por: <Badge variant="secondary">{routine.assignedByInstructorName}</Badge>
              <br/>
              Periodo: {new Date(routine.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} - 
              {new Date(routine.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </CardDescription>
          </div>
           {/* Placeholder for future "Edit Routine" button for instructors */}
          {/* <Button variant="outline" size="sm"><Edit size={16} className="mr-2"/> Editar Rutina</Button> */}
        </div>
         {routine.notes && (
            <div className="mt-4 p-3 bg-secondary/20 rounded-md border border-border/30">
                <p className="text-sm text-foreground flex items-start">
                    <Info size={18} className="mr-2 mt-0.5 shrink-0 text-accent"/> 
                    <span><strong className="font-medium">Nota del Instructor:</strong> {routine.notes}</span>
                </p>
            </div>
        )}
      </CardHeader>
      <CardContent>
        {days.length > 0 ? (
          <Accordion type="single" collapsible className="w-full" defaultValue={days[0] ? `day-${days[0].id}` : undefined}>
            {days.map((day) => {
              const dayExercises = exercises.filter(ex => ex.routineDayId === day.id).sort((a,b) => a.order - b.order);
              return (
                <AccordionItem value={`day-${day.id}`} key={day.id} className="border-b border-border/50 last:border-b-0">
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4 px-2 text-left">
                    <div className="flex items-center">
                       <CalendarDays className="mr-3 h-5 w-5 text-accent" /> {day.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 px-2">
                    {day.description && <p className="text-sm text-muted-foreground mb-4 italic bg-muted/50 p-2 rounded-md">{day.description}</p>}
                    {dayExercises.length > 0 ? (
                      <ul className="space-y-3">
                        {dayExercises.map((exercise) => (
                          <li key={exercise.id} className="p-3 border border-border/40 rounded-md bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-grow">
                                <p className="font-medium text-foreground">{exercise.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {exercise.sets} series x {exercise.reps} reps
                                  {exercise.weight && <span className="font-semibold"> @ {exercise.weight}</span>}
                                  {exercise.restPeriod && <span className="italic"> (Descanso: {exercise.restPeriod})</span>}
                                </p>
                                {exercise.notes && <p className="text-xs text-accent mt-1 italic">{exercise.notes}</p>}
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <Checkbox 
                                  id={`exercise-${exercise.id}-${day.id}`} 
                                  // defaultChecked={exercise.isCompleted} // Visual only for now
                                  className="h-5 w-5 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                                <Label htmlFor={`exercise-${exercise.id}-${day.id}`} className="text-sm sr-only">Completado</Label>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No hay ejercicios asignados para este día.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <p className="text-muted-foreground text-center py-6">Esta rutina aún no tiene días definidos.</p>
        )}
      </CardContent>
    </Card>
  );
}
