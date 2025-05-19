
"use client";

import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ClassSchedule } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { iconOptions } from "@/lib/icons";

const classFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100),
  instructor: z.string().min(3, "El instructor debe tener al menos 3 caracteres.").max(100),
  time: z.string().min(5, "El horario es requerido.").max(100),
  duration: z.string().min(3, "La duración es requerida.").max(50),
  availableSlots: z.coerce.number().int().min(0, "Los cupos disponibles no pueden ser negativos."),
  totalSlots: z.coerce.number().int().min(0, "Los cupos totales no pueden ser negativos."),
  description: z.string().max(500, "La descripción no puede exceder los 500 caracteres.").optional(),
  iconName: z.string().optional(),
  imageUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  imageHint: z.string().max(50, "La pista no puede exceder 50 caracteres.").optional(),
}).refine(data => data.availableSlots <= data.totalSlots, {
  message: "Los cupos disponibles no pueden exceder los cupos totales.",
  path: ["availableSlots"], 
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface ClassFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  classItem: ClassSchedule | null;
  onSubmit: (data: ClassSchedule | Omit<ClassSchedule, 'id'>) => void;
}

export function ClassFormDialog({ isOpen, onOpenChange, classItem, onSubmit }: ClassFormDialogProps) {
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      instructor: "",
      time: "",
      duration: "",
      availableSlots: 0,
      totalSlots: 0,
      description: "",
      iconName: iconOptions[0]?.value || "", // Default to first icon or empty
      imageUrl: "",
      imageHint: "",
    },
  });

  useEffect(() => {
    if (isOpen) { // Reset form when dialog opens or classItem changes
      if (classItem) {
        form.reset({
          name: classItem.name,
          instructor: classItem.instructor,
          time: classItem.time,
          duration: classItem.duration,
          availableSlots: classItem.availableSlots,
          totalSlots: classItem.totalSlots,
          description: classItem.description || "",
          iconName: classItem.iconName || iconOptions[0]?.value || "",
          imageUrl: classItem.imageUrl || "",
          imageHint: classItem.imageHint || "",
        });
      } else {
        form.reset({
          name: "",
          instructor: "",
          time: "",
          duration: "",
          availableSlots: 0,
          totalSlots: 10, // Default total slots for new class
          description: "",
          iconName: iconOptions[0]?.value || "",
          imageUrl: "",
          imageHint: "",
        });
      }
    }
  }, [classItem, form, isOpen]);

  const handleSubmit: SubmitHandler<ClassFormValues> = (data) => {
    if (classItem) {
      onSubmit({ ...classItem, ...data });
    } else {
      onSubmit(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{classItem ? "Editar Clase" : "Añadir Nueva Clase"}</DialogTitle>
          <DialogDescription>
            {classItem ? "Actualiza los detalles de la clase." : "Completa la información para añadir una nueva clase."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Clase</FormLabel>
                  <FormControl><Input placeholder="Ej: Yoga Avanzado" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <FormControl><Input placeholder="Ej: Ana Martínez" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horario</FormLabel>
                    <FormControl><Input placeholder="Ej: Lun, Mié 18:00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración</FormLabel>
                    <FormControl><Input placeholder="Ej: 60 minutos" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="availableSlots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cupos Disponibles</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalSlots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cupos Totales</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Describe la clase..." {...field} rows={3} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="iconName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono de la Clase</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un icono" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {iconOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Selecciona un icono representativo para la clase.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Imagen (Opcional)</FormLabel>
                  <FormControl><Input placeholder="https://placehold.co/600x400.png" {...field} /></FormControl>
                  <FormDescription>URL de una imagen para la tarjeta de la clase.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pista para IA de Imagen (Opcional)</FormLabel>
                  <FormControl><Input placeholder="Ej: clase yoga amanecer" {...field} /></FormControl>
                  <FormDescription>Palabras clave para la imagen (máx. 2 palabras).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">
                {classItem ? "Guardar Cambios" : "Añadir Clase"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
