
"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, type SubmitHandler, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Routine, RoutineDay, RoutineExercise, AdminMember } from "@/types";
import { v4 as uuidv4 } from 'uuid';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Trash2, GripVertical, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

const exerciseSchema = z.object({
  id: z.string().default(() => uuidv4()),
  name: z.string().min(1, "El nombre del ejercicio es requerido.").max(100),
  sets: z.string().min(1, "Series son requeridas.").max(20),
  reps: z.string().min(1, "Repeticiones son requeridas.").max(20),
  weight: z.string().max(50).optional(),
  restPeriod: z.string().max(50).optional(),
  notes: z.string().max(200).optional(),
  order: z.number().default(0),
});

const daySchema = z.object({
  id: z.string().default(() => uuidv4()),
  name: z.string().min(1, "El nombre del día es requerido.").max(100),
  order: z.number().default(0),
  description: z.string().max(300).optional(),
  exercises: z.array(exerciseSchema).default([]),
});

const routineFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100),
  assignedToMemberId: z.string().nullable().optional(),
  startDate: z.date({ required_error: "La fecha de inicio es requerida." }),
  endDate: z.date({ required_error: "La fecha de fin es requerida." }),
  notes: z.string().max(500).optional(),
  days: z.array(daySchema).min(1, "Debe añadir al menos un día a la rutina.").default([]),
}).refine(data => data.endDate >= data.startDate, {
  message: "La fecha de fin no puede ser anterior a la fecha de inicio.",
  path: ["endDate"],
});

type RoutineFormValues = z.infer<typeof routineFormSchema>;

interface RoutineFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  routine: Routine | null;
  availableMembers: AdminMember[];
  onSubmit: (data: any) => void; // Ajustar el tipo según lo que devuelva el form
  instructorName: string;
}

export function RoutineFormDialog({ isOpen, onOpenChange, routine, availableMembers, onSubmit, instructorName }: RoutineFormDialogProps) {
  
  const defaultStartDate = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const defaultEndDate = useMemo(() => addDays(defaultStartDate, 30), [defaultStartDate]);

  const form = useForm<RoutineFormValues>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: {
      name: "",
      assignedToMemberId: null,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      notes: "",
      days: [],
    },
  });

  const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({
    control: form.control,
    name: "days",
  });

  useEffect(() => {
    if (isOpen) {
      if (routine) {
        form.reset({
          name: routine.name,
          assignedToMemberId: routine.assignedToMemberId,
          startDate: routine.startDate ? parseISO(routine.startDate) : defaultStartDate,
          endDate: routine.endDate ? parseISO(routine.endDate) : defaultEndDate,
          notes: routine.notes || "",
          days: routine.days.map(d => ({
            ...d,
            id: d.id || uuidv4(),
            exercises: d.exercises.map(e => ({ ...e, id: e.id || uuidv4() }))
          })) || [],
        });
      } else {
        form.reset({
          name: "",
          assignedToMemberId: null,
          startDate: defaultStartDate,
          endDate: defaultEndDate,
          notes: "",
          days: [{ id: uuidv4(), name: "Día 1", order: 0, exercises: [] }], // Iniciar con un día
        });
      }
    }
  }, [routine, isOpen, form.reset, defaultStartDate, defaultEndDate]);

  const handleSubmitForm: SubmitHandler<RoutineFormValues> = (data) => {
    const submissionData = {
      ...data,
      startDate: format(data.startDate, "yyyy-MM-dd"),
      endDate: format(data.endDate, "yyyy-MM-dd"),
      assignedByInstructorName: instructorName, // Añadido aquí
      // Asegurar que los IDs de días y ejercicios existan si son nuevos
      days: data.days.map((day, dayIndex) => ({
        ...day,
        id: day.id || uuidv4(),
        order: day.order !== undefined ? day.order : dayIndex,
        exercises: day.exercises.map((ex, exIndex) => ({
          ...ex,
          id: ex.id || uuidv4(),
          order: ex.order !== undefined ? ex.order : exIndex,
        }))
      }))
    };

    if (routine) { // Si estamos editando, mantenemos el ID original de la rutina
      onSubmit({ ...submissionData, id: routine.id });
    } else { // Si es nueva, el ID se generará en el contexto/backend
      onSubmit(submissionData);
    }
    onOpenChange(false);
  };
  
  const addNewDay = () => {
    appendDay({ 
      id: uuidv4(), 
      name: `Día ${dayFields.length + 1}`, 
      order: dayFields.length, 
      exercises: [] 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{routine ? "Editar Rutina" : "Crear Nueva Rutina"}</DialogTitle>
          <DialogDescription>
            {routine ? "Actualiza los detalles de la rutina." : "Completa la información para crear una nueva rutina de entrenamiento."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-4 py-2">
            <ScrollArea className="h-[calc(80vh-100px)] pr-4"> {/* Ajustar altura según necesidad y padding */}
              <div className="space-y-6 p-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Rutina</FormLabel>
                      <FormControl><Input placeholder="Ej: Rutina de Fuerza Intermedia" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="assignedToMemberId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col md:col-span-2">
                        <FormLabel>Asignar a Miembro (Opcional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                              >
                                {field.value
                                  ? availableMembers.find((member) => member.id === field.value)?.name
                                  : "Seleccionar miembro"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar miembro..." />
                              <CommandEmpty>No se encontró ningún miembro.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value={"_ninguno_"}
                                  onSelect={() => field.onChange(null)}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", field.value === null ? "opacity-100" : "opacity-0")}/>
                                  (Sin asignar / Plantilla)
                                </CommandItem>
                                {availableMembers.map((member) => (
                                  <CommandItem
                                    value={member.id}
                                    key={member.id}
                                    onSelect={() => field.onChange(member.id)}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", member.id === field.value ? "opacity-100" : "opacity-0")}/>
                                    {member.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Fecha de Fin</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Generales de la Rutina (Opcional)</FormLabel>
                      <FormControl><Textarea placeholder="Añade notas o instrucciones generales..." {...field} rows={3} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-6">
                  <FormLabel className="text-lg font-semibold">Días de Entrenamiento</FormLabel>
                  {dayFields.map((dayField, dayIndex) => (
                    <RoutineDayFieldArray 
                        key={dayField.id} 
                        form={form} 
                        dayIndex={dayIndex} 
                        removeDay={removeDay} 
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addNewDay} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Día
                  </Button>
                   <FormMessage>{form.formState.errors.days?.message || form.formState.errors.days?.root?.message}</FormMessage>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">
                {routine ? "Guardar Cambios" : "Crear Rutina"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Componente separado para manejar la lógica de un día y sus ejercicios
interface RoutineDayFieldArrayProps {
  form: any; // UseFormReturn<RoutineFormValues>; // Tipo más específico si es posible
  dayIndex: number;
  removeDay: (index: number) => void;
}

function RoutineDayFieldArray({ form, dayIndex, removeDay }: RoutineDayFieldArrayProps) {
  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
    control: form.control,
    name: `days.${dayIndex}.exercises`,
  });

  const addNewExercise = () => {
    appendExercise({ 
      id: uuidv4(), 
      name: "", 
      sets: "", 
      reps: "", 
      order: exerciseFields.length 
    });
  };

  return (
    <Card className="p-4 space-y-3 border-border/70 shadow-sm">
      <div className="flex justify-between items-center">
        <FormField
          control={form.control}
          name={`days.${dayIndex}.name`}
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel>Nombre del Día {dayIndex + 1}</FormLabel>
              <FormControl><Input placeholder="Ej: Día de Pecho y Tríceps" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="button" variant="ghost" size="icon" onClick={() => removeDay(dayIndex)} className="ml-2 self-end text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <FormField
        control={form.control}
        name={`days.${dayIndex}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción del Día (Opcional)</FormLabel>
            <FormControl><Textarea placeholder="Enfoque o notas para este día..." {...field} rows={2} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="space-y-3 pl-4 border-l-2 border-accent/30">
        <FormLabel className="text-md font-medium">Ejercicios del Día</FormLabel>
        {exerciseFields.map((exerciseField, exerciseIndex) => (
          <Card key={exerciseField.id} className="p-3 space-y-2 bg-secondary/30">
            <div className="flex justify-between items-start">
                <p className="text-sm font-semibold text-secondary-foreground">Ejercicio {exerciseIndex + 1}</p>
                 <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(exerciseIndex)} className="text-destructive hover:bg-destructive/10 h-7 px-2">
                    <Trash2 className="h-3 w-3 mr-1" /> Quitar
                </Button>
            </div>
            <FormField
              control={form.control}
              name={`days.${dayIndex}.exercises.${exerciseIndex}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Nombre Ejercicio</FormLabel>
                  <FormControl><Input placeholder="Ej: Press de Banca" {...field} className="h-8 text-sm" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <FormField
                control={form.control}
                name={`days.${dayIndex}.exercises.${exerciseIndex}.sets`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Series</FormLabel>
                    <FormControl><Input placeholder="Ej: 3-4" {...field} className="h-8 text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`days.${dayIndex}.exercises.${exerciseIndex}.reps`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Reps</FormLabel>
                    <FormControl><Input placeholder="Ej: 8-12" {...field} className="h-8 text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`days.${dayIndex}.exercises.${exerciseIndex}.weight`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Peso (Opc.)</FormLabel>
                    <FormControl><Input placeholder="Ej: 70kg" {...field} className="h-8 text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`days.${dayIndex}.exercises.${exerciseIndex}.restPeriod`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Descanso (Opc.)</FormLabel>
                    <FormControl><Input placeholder="Ej: 60s" {...field} className="h-8 text-sm" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name={`days.${dayIndex}.exercises.${exerciseIndex}.notes`}
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-xs">Notas Ejercicio (Opc.)</FormLabel>
                    <FormControl><Textarea placeholder="Técnica, tempo, etc." {...field} rows={1} className="text-sm min-h-[2rem]"/></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
          </Card>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addNewExercise} className="mt-1 border-dashed">
          <PlusCircle className="mr-2 h-3 w-3" /> Añadir Ejercicio a este Día
        </Button>
        <FormMessage>{form.formState.errors.days?.[dayIndex]?.exercises?.message || form.formState.errors.days?.[dayIndex]?.exercises?.root?.message}</FormMessage>
      </div>
    </Card>
  );
}
