
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PaymentRecord, AdminMember, PaymentMethod, PaymentStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/constants";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const paymentFormSchema = z.object({
  memberId: z.string().min(1, "Debe seleccionar un miembro."),
  paymentDate: z.date({ required_error: "La fecha de pago es requerida." }),
  amount: z.coerce.number().min(0.01, "El monto debe ser mayor a cero."),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    errorMap: () => ({ message: "Debe seleccionar un método de pago válido." }),
  }),
  coveredPeriodStart: z.date({ required_error: "La fecha de inicio del período es requerida." }),
  coveredPeriodEnd: z.date({ required_error: "La fecha de fin del período es requerida." }),
  status: z.enum(PAYMENT_STATUSES, {
    errorMap: () => ({ message: "Debe seleccionar un estado de pago válido." }),
  }),
  notes: z.string().max(500, "Las notas no pueden exceder los 500 caracteres.").optional(),
}).refine(data => data.coveredPeriodEnd >= data.coveredPeriodStart, {
  message: "La fecha de fin del período no puede ser anterior a la fecha de inicio.",
  path: ["coveredPeriodEnd"],
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  paymentItem: PaymentRecord | null;
  members: AdminMember[];
  onSubmit: (data: Omit<PaymentRecord, 'id' | 'memberName'> | PaymentRecord) => void;
}

export function PaymentFormDialog({ isOpen, onOpenChange, paymentItem, members, onSubmit }: PaymentFormDialogProps) {
  
  const initialDefaultValues = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      memberId: "",
      paymentDate: today,
      amount: 0,
      paymentMethod: "Efectivo" as PaymentMethod,
      coveredPeriodStart: today,
      coveredPeriodEnd: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()),
      status: "Pagado" as PaymentStatus,
      notes: "",
    };
  }, []);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: initialDefaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      if (paymentItem) {
        form.reset({
          memberId: paymentItem.memberId,
          paymentDate: parseISO(paymentItem.paymentDate),
          amount: paymentItem.amount,
          paymentMethod: paymentItem.paymentMethod,
          coveredPeriodStart: parseISO(paymentItem.coveredPeriodStart),
          coveredPeriodEnd: parseISO(paymentItem.coveredPeriodEnd),
          status: paymentItem.status,
          notes: paymentItem.notes || "",
        });
      } else {
        form.reset(initialDefaultValues);
      }
    }
  }, [paymentItem, isOpen, form.reset, initialDefaultValues]);

  const handleSubmit: SubmitHandler<PaymentFormValues> = (data) => {
    const submissionData = {
      ...data,
      paymentDate: format(data.paymentDate, "yyyy-MM-dd"),
      coveredPeriodStart: format(data.coveredPeriodStart, "yyyy-MM-dd"),
      coveredPeriodEnd: format(data.coveredPeriodEnd, "yyyy-MM-dd"),
    };

    if (paymentItem) {
      onSubmit({ ...paymentItem, ...submissionData });
    } else {
      // const { id, memberName, ...rest } = paymentItem || {}; // This line seems to have a typo, paymentItem might be null here.
      onSubmit(submissionData as Omit<PaymentRecord, 'id' | 'memberName'>);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{paymentItem ? "Editar Registro de Pago" : "Añadir Nuevo Pago"}</DialogTitle>
          <DialogDescription>
            {paymentItem ? "Actualiza los detalles del pago." : "Completa la información para registrar un nuevo pago."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Miembro</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? members.find(
                                (member) => member.id === field.value
                              )?.name
                            : "Selecciona un miembro"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar miembro..." />
                        <CommandEmpty>No se encontró ningún miembro.</CommandEmpty>
                        <CommandGroup>
                          {members.map((member) => (
                            <CommandItem
                              value={member.id} // Use member.id as the value for onSelect
                              key={member.id}
                              onSelect={(currentValue) => { // currentValue is member.id
                                field.onChange(currentValue);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  member.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {member.name} ({member.email})
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Pago</FormLabel>
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
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="Ej: 49.99" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_METHODS.map(method => (
                          <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado del Pago</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <fieldset className="border p-4 rounded-md space-y-4">
              <legend className="text-sm font-medium px-1">Período Cubierto por el Pago</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="coveredPeriodStart"
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
                  name="coveredPeriodEnd"
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
            </fieldset>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Añade notas adicionales sobre el pago..." {...field} rows={3} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
               <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">
                {paymentItem ? "Guardar Cambios" : "Añadir Pago"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    