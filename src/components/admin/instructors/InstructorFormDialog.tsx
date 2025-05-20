
"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Instructor } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";


const instructorFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100),
  email: z.string().email("Formato de email inválido.").max(100),
  specialization: z.string().min(3, "La especialización es requerida.").max(150),
  bio: z.string().max(500, "La biografía no puede exceder los 500 caracteres.").optional(),
  joinDate: z.date({ required_error: "La fecha de ingreso es requerida."}),
  profilePictureUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  profilePictureHint: z.string().max(50, "La pista no puede exceder 50 caracteres.").optional(),
});

type InstructorFormValues = z.infer<typeof instructorFormSchema>;

interface InstructorFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  instructor: Instructor | null;
  onSubmit: (data: Instructor | Omit<Instructor, 'id'>) => void;
}

export function InstructorFormDialog({ isOpen, onOpenChange, instructor, onSubmit }: InstructorFormDialogProps) {
  
  const defaultJoinDate = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const form = useForm<InstructorFormValues>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      specialization: "",
      bio: "",
      joinDate: defaultJoinDate,
      profilePictureUrl: "",
      profilePictureHint: "persona retrato",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (instructor) {
        form.reset({
          name: instructor.name,
          email: instructor.email,
          specialization: instructor.specialization,
          bio: instructor.bio || "",
          joinDate: instructor.joinDate ? parseISO(instructor.joinDate) : defaultJoinDate,
          profilePictureUrl: instructor.profilePictureUrl || "",
          profilePictureHint: instructor.profilePictureHint || "persona retrato",
        });
      } else {
        form.reset({
          name: "",
          email: "",
          specialization: "",
          bio: "",
          joinDate: defaultJoinDate,
          profilePictureUrl: "",
          profilePictureHint: "persona retrato",
        });
      }
    }
  }, [instructor, isOpen, form.reset, defaultJoinDate]);

  const handleSubmit: SubmitHandler<InstructorFormValues> = (data) => {
    const submissionData = {
      ...data,
      joinDate: format(data.joinDate, "yyyy-MM-dd"),
    };
    if (instructor) {
      onSubmit({ ...instructor, ...submissionData });
    } else {
      onSubmit(submissionData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{instructor ? "Editar Instructor" : "Añadir Nuevo Instructor"}</DialogTitle>
          <DialogDescription>
            {instructor ? "Actualiza los detalles del instructor." : "Completa la información para añadir un nuevo instructor."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <ScrollArea className="h-[calc(80vh-100px)] pr-4">
              <div className="space-y-4 p-1">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl><Input placeholder="Ej: Ana Entrenadora" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl><Input type="email" placeholder="ej: ana.e@gymflow.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialización(es)</FormLabel>
                      <FormControl><Input placeholder="Ej: Yoga, Crossfit, Nutrición Deportiva" {...field} /></FormControl>
                      <FormDescription>Separa las especializaciones por coma.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografía (Opcional)</FormLabel>
                      <FormControl><Textarea placeholder="Breve descripción sobre el instructor..." {...field} rows={4} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Ingreso</FormLabel>
                       <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Elige una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profilePictureUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Foto de Perfil (Opcional)</FormLabel>
                      <FormControl><Input placeholder="https://placehold.co/100x100.png" {...field} /></FormControl>
                      <FormDescription>URL de una imagen para el perfil del instructor.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profilePictureHint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pista para IA de Foto (Opcional)</FormLabel>
                      <FormControl><Input placeholder="Ej: entrenador sonriendo" {...field} /></FormControl>
                      <FormDescription>Palabras clave para la imagen (máx. 2 palabras).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
               <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">
                {instructor ? "Guardar Cambios" : "Añadir Instructor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
