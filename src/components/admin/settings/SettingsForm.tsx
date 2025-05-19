
"use client";

import React, { useEffect } from 'react'; // Import useEffect
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { GymSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Globe, Instagram, Facebook, Twitter, Save } from "lucide-react";

const settingsFormSchema = z.object({
  gymName: z.string().min(3, "El nombre del gimnasio debe tener al menos 3 caracteres.").max(100),
  address: z.string().max(300, "La dirección no puede exceder los 300 caracteres.").optional().or(z.literal('')),
  phone: z.string().max(30, "El teléfono no puede exceder los 30 caracteres.").optional().or(z.literal('')),
  email: z.string().email("Formato de email inválido.").max(100).optional().or(z.literal('')),
  instagramUrl: z.string().url("Debe ser una URL válida para Instagram.").max(200).optional().or(z.literal('')),
  facebookUrl: z.string().url("Debe ser una URL válida para Facebook.").max(200).optional().or(z.literal('')),
  twitterUrl: z.string().url("Debe ser una URL válida para X/Twitter.").max(200).optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface SettingsFormProps {
  currentSettings: GymSettings; // Will come from context via SettingsClient
  onSubmit: (data: SettingsFormValues) => void;
}

export function SettingsForm({ currentSettings, onSubmit }: SettingsFormProps) {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    // Default values will be set by useEffect
  });

  useEffect(() => {
    if (currentSettings) {
      form.reset({
        gymName: currentSettings.gymName || "",
        address: currentSettings.address || "",
        phone: currentSettings.phone || "",
        email: currentSettings.email || "",
        instagramUrl: currentSettings.instagramUrl || "",
        facebookUrl: currentSettings.facebookUrl || "",
        twitterUrl: currentSettings.twitterUrl || "",
      });
    }
  }, [currentSettings, form.reset]);

  const handleSubmit: SubmitHandler<SettingsFormValues> = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="gymName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Gimnasio</FormLabel>
              <FormControl>
                <Input placeholder="Ej: GymFlow Central" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección (Opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Av. Principal 123, Ciudad" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (Opcional)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Ej: +34 900 000 000" {...field} />
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
                <FormLabel>Email de Contacto (Opcional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Ej: contacto@gymflow.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <fieldset className="border p-4 rounded-md space-y-4">
          <legend className="text-sm font-medium px-1 text-muted-foreground flex items-center">
            <Globe className="mr-2 h-4 w-4" /> Redes Sociales (Opcional)
          </legend>
          <FormField
            control={form.control}
            name="instagramUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Instagram className="mr-2 h-4 w-4 text-[#E1306C]" /> Instagram URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://instagram.com/tugimnasio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="facebookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Facebook className="mr-2 h-4 w-4 text-[#1877F2]" /> Facebook URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://facebook.com/tugimnasio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="twitterUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Twitter className="mr-2 h-4 w-4 text-[#1DA1F2]" /> X (Twitter) URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://twitter.com/tugimnasio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <div className="flex justify-end pt-4">
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Form>
  );
}
