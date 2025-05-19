"use client";

import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AdminMember, SubscriptionPlan } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const memberFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100),
  email: z.string().email("Formato de email inválido."),
  status: z.enum(["Activo", "Inactivo", "Suspendido"], {
    errorMap: () => ({ message: "Debe seleccionar un estado válido." }),
  }),
  subscriptionPlanId: z.string().nullable().optional(), // Puede ser nulo o no estar presente
  joinDate: z.string().optional(), // Se manejará automáticamente si es nuevo
  profilePictureUrl: z.string().url().optional().or(z.literal('')),
  profilePictureHint: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberFormSchema>;

interface MemberFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  member: AdminMember | null;
  availablePlans: SubscriptionPlan[];
  onSubmit: (data: AdminMember) => void;
}

export function MemberFormDialog({ isOpen, onOpenChange, member, availablePlans, onSubmit }: MemberFormDialogProps) {
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: "",
      email: "",
      status: "Activo",
      subscriptionPlanId: null,
      joinDate: new Date().toISOString().split('T')[0], // Default to today
      profilePictureUrl: "",
      profilePictureHint: "persona avatar",
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email,
        status: member.status,
        subscriptionPlanId: member.subscriptionPlanId,
        joinDate: member.joinDate, // Mantener la fecha original si se edita
        profilePictureUrl: member.profilePictureUrl || "",
        profilePictureHint: member.profilePictureHint || "persona avatar",
      });
    } else {
      form.reset({ // Valores por defecto para nuevo miembro
        name: "",
        email: "",
        status: "Activo",
        subscriptionPlanId: null,
        joinDate: new Date().toISOString().split('T')[0],
        profilePictureUrl: "",
        profilePictureHint: "persona avatar",
      });
    }
  }, [member, form, isOpen]); // Re-ejecutar cuando isOpen cambia para resetear bien

  const handleSubmit: SubmitHandler<MemberFormValues> = (data) => {
    const submissionData: AdminMember = {
      ...(member || { id: "", joinDate: new Date().toISOString().split('T')[0] }), // Preserve ID and joinDate if editing
      ...data,
      id: member ? member.id : `new_${Date.now()}`, // Generate new ID if not editing
      joinDate: member ? member.joinDate : data.joinDate || new Date().toISOString().split('T')[0], // Use existing or new joinDate
      subscriptionPlanId: data.subscriptionPlanId || null,
    };
    onSubmit(submissionData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{member ? "Editar Miembro" : "Añadir Nuevo Miembro"}</DialogTitle>
          <DialogDescription>
            {member ? "Actualiza los detalles del miembro." : "Completa la información para añadir un nuevo miembro."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Ana Pérez" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input type="email" placeholder="ej: ana.perez@correo.com" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input placeholder="https://placehold.co/100x100.png" {...field} />
                  </FormControl>
                  <FormDescription>Introduce la URL de una imagen para el perfil.</FormDescription>
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
                  <FormControl>
                    <Input placeholder="persona sonriendo" {...field} />
                  </FormControl>
                  <FormDescription>Palabras clave para la imagen (ej. "hombre fitness").</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                      <SelectItem value="Suspendido">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subscriptionPlanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan de Suscripción</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                    value={field.value === null ? "none" : field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin Plan</SelectItem>
                      {availablePlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>{plan.name} ({plan.duration})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">
                {member ? "Guardar Cambios" : "Añadir Miembro"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
