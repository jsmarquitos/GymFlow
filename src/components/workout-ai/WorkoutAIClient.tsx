
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAIWorkoutSuggestion, sendWorkoutByEmail } from "@/app/workout-ai/actions";
import type { SuggestWorkoutRoutineOutput } from "@/ai/flows/suggest-workout-routine";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, AlertTriangle, Send } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const workoutFormSchema = z.object({
  fitnessGoal: z.string().min(3, { message: "El objetivo de fitness debe tener al menos 3 caracteres." }).max(100),
  preferredActivities: z.string().min(3, { message: "Las actividades preferidas deben tener al menos 3 caracteres." }).max(200),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

export function WorkoutAIClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestWorkoutRoutineOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailSendMessage, setEmailSendMessage] = useState<string | null>(null);

  const { user } = useAuth();

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      fitnessGoal: "",
      preferredActivities: "",
    },
  });

  const onSubmit: SubmitHandler<WorkoutFormValues> = async (data) => {
    setIsLoading(true);
    setSuggestion(null);
    setError(null);
    setEmailSendStatus('idle'); // Reset email status on new suggestion
    setEmailSendMessage(null);

    const result = await getAIWorkoutSuggestion(data);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuggestion(result);
    }
    setIsLoading(false);
  };

  const handleSendEmail = async () => {
    if (!suggestion || !suggestion.workoutRoutine ) {
      setEmailSendStatus('error');
      setEmailSendMessage("No hay rutina para enviar o falta información del usuario.");
      return;
    }
    if (!user || !user.email) {
      setEmailSendStatus('error');
      setEmailSendMessage("Debes iniciar sesión con un correo electrónico registrado para enviar la rutina.");
      return;
    }


    setIsSendingEmail(true);
    setEmailSendMessage(null);

    const result = await sendWorkoutByEmail(suggestion.workoutRoutine, user.email);

    if ("error" in result || (result && !result.success)) {
      setEmailSendStatus('error');
      setEmailSendMessage(result.error || (result && result.message) || "Ocurrió un error al enviar el correo.");
    } else if (result && result.success) {
      setEmailSendStatus('success');
      setEmailSendMessage(result.message || "Rutina enviada exitosamente por correo.");
    }
    setIsSendingEmail(false);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="mr-2 h-6 w-6 text-accent" />
                Sugerencia de Entrenamiento Personalizado
              </CardTitle>
              <CardDescription>
                Dinos tus objetivos y preferencias, y nuestra IA te sugerirá una rutina de entrenamiento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fitnessGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="fitnessGoal">Objetivo de Fitness</FormLabel>
                    <FormControl>
                      <Input
                        id="fitnessGoal"
                        placeholder="Ej: Pérdida de peso, Ganar músculo, Resistencia"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      ¿Qué quieres lograr?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferredActivities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="preferredActivities">Actividades Preferidas</FormLabel>
                    <FormControl>
                      <Textarea
                        id="preferredActivities"
                        placeholder="Ej: Correr, Nadar, Levantamiento de pesas, Yoga"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                     <FormDescription>
                      ¿Qué tipo de actividades disfrutas?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  "Obtener Sugerencia"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" />
              Error al generar sugerencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {suggestion && (
        <Card className="shadow-lg bg-secondary mt-8">
          <CardHeader>
            <CardTitle className="text-xl text-secondary-foreground">Tu Rutina de Entrenamiento Sugerida por IA</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-secondary-foreground p-4 bg-background rounded-md font-mono overflow-x-auto">
              {suggestion.workoutRoutine}
            </pre>
          </CardContent>
          {/* Condición actualizada para mostrar el botón si el usuario está logueado y tiene email */}
          {user && user.email && (
            <CardFooter className="flex-col items-start gap-2 pt-4 border-t border-border">
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail || !suggestion?.workoutRoutine}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Rutina a mi Correo
                  </>
                )}
              </Button>
              {emailSendMessage && (
                <p className={`text-xs mt-2 ${emailSendStatus === 'error' ? 'text-destructive-foreground' : 'text-muted-foreground'}`}>
                  {emailSendMessage}
                </p>
              )}
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
