
"use client";

import { useState } from "react";
import type { GymSettings } from "@/types";
import { SettingsForm } from "./SettingsForm";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsClientProps {
  initialSettings: GymSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState<GymSettings>(initialSettings);
  const { toast } = useToast();

  const handleSubmit = (updatedSettings: GymSettings) => {
    // En una aplicación real, aquí harías una llamada a una API para guardar los cambios.
    console.log("Guardando configuración:", updatedSettings);
    setSettings(updatedSettings);
    toast({
      title: "Configuración Guardada",
      description: "Los datos generales del gimnasio han sido actualizados (simulación).",
      variant: "default",
    });
  };

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
