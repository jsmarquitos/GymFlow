
"use client";

import React, { useEffect, useMemo } from "react"; // Added React and useMemo
import { useForm, type SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { SubscriptionPlan } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PlusCircle, Trash2 } from "lucide-react";

const planFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres.").max(100),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  duration: z.enum(["Mensual", "Trimestral", "Anual", "Otro"], {
    errorMap: () => ({ message: "Debe seleccionar una duración válida." }),
  }),
  description: z.string().max(300, "La descripción no puede exceder los 300 caracteres.").optional(),
  features: z.array(z.object({ value: z.string().min(1, "La característica no puede estar vacía.") })).min(1, "Debe añadir al menos una característica."),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface SubscriptionPlanFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plan: SubscriptionPlan | null;
  onSubmit: (data: SubscriptionPlan | Omit<SubscriptionPlan, 'id'>) => void;
}

export function SubscriptionPlanFormDialog({ isOpen, onOpenChange, plan, onSubmit }: SubscriptionPlanFormDialogProps) {
  const defaultFormValues = useMemo(() => ({
    name: "",
    price: 0,
    duration: "Mensual" as SubscriptionPlan['duration'],
    description: "",
    features: [{ value: "" }],
  }), []);
  
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  });

  useEffect(() => {
    if (isOpen) {
      if (plan) {
        form.reset({
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          description: plan.description || "",
          features: plan.features.map(f => ({ value: f })),
        });
      } else {
        form.reset(defaultFormValues);
      }
    }
  }, [plan, isOpen, form.reset, defaultFormValues]);

  const handleSubmit: SubmitHandler<PlanFormValues> = (data) => {
    const submissionData = {
      ...data,
      features: data.features.map(f => f.value), 
    };
    if (plan) {
      onSubmit({ ...plan, ...submissionData });
    } else {
      onSubmit(submissionData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plan de Suscripción" : "Añadir Nuevo Plan"}</DialogTitle>
          <DialogDescription>
            {plan ? "Actualiza los detalles del plan." : "Completa la información para añadir un nuevo plan."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Plan</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Plan Gold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ej: 49.99" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona duración" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mensual">Mensual</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormControl>
                    <Textarea placeholder="Breve descripción del plan..." {...field} rows={3}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Características del Plan</FormLabel>
              {fields.map((item, index) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name={`features.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 mt-1">
                      <FormControl>
                        <Input placeholder={`Característica ${index + 1}`} {...field} />
                      </FormControl>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ value: "" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Característica
              </Button>
              <FormMessage>
                {form.formState.errors.features?.root?.message || form.formState.errors.features?.message}
              </FormMessage>
            </div>

            <DialogFooter>
               <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">
                {plan ? "Guardar Cambios" : "Añadir Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
