
"use client";

import type { GymSettings } from "@/types";
import { SettingsForm } from "./SettingsForm";
import { useToast } from "@/hooks/use-toast";
import { useGymSettings } from "@/hooks/useGymSettings"; // Import useGymSettings
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function SettingsClient() {
  const { settings, updateSettings, isLoading } = useGymSettings(); // Use context
  const { toast } = useToast();

  const handleSubmit = (updatedSettingsData: GymSettings) => {
    updateSettings(updatedSettingsData); // Update settings via context
    toast({
      title: "Configuración Guardada",
      description: "Los datos generales del gimnasio han sido actualizados.",
      variant: "default",
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Editar Información del Gimnasio</CardTitle>
        <CardDescription>
          Modifica los datos que se mostrarán públicamente sobre tu gimnasio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsForm currentSettings={settings} onSubmit={handleSubmit} />
      </CardContent>
    </Card>
  );
}
