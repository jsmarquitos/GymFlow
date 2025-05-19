"use server";

import { suggestWorkoutRoutine, type SuggestWorkoutRoutineInput, type SuggestWorkoutRoutineOutput } from '@/ai/flows/suggest-workout-routine';
import { sendEmail, type SendEmailInput, type SendEmailOutput } from '@/ai/flows/send-email-flow';


export async function getAIWorkoutSuggestion(input: SuggestWorkoutRoutineInput): Promise<SuggestWorkoutRoutineOutput | { error: string }> {
  try {
    const result = await suggestWorkoutRoutine(input);
    return result;
  } catch (error) {
    console.error("Error getting AI workout suggestion:", error);
    return { error: "Error al generar la sugerencia de entrenamiento. Por favor, inténtalo de nuevo." };
  }
}

export async function sendWorkoutByEmail(
  workoutRoutine: string,
  userEmail: string
): Promise<SendEmailOutput | { error: string }> {
  if (!userEmail) {
    return { error: "No se pudo obtener el correo electrónico del usuario para enviar la rutina." };
  }
  try {
    const emailInput: SendEmailInput = {
      to: userEmail,
      subject: "Tu Rutina de Entrenamiento Personalizada de GymFlow",
      body: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #42C2FF;">¡Hola!</h2>
            <p>Aquí tienes tu rutina de entrenamiento sugerida por la IA de GymFlow:</p>
            <div style="background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px;">
              <pre style="white-space: pre-wrap; font-family: 'Courier New', Courier, monospace; font-size: 14px;">${workoutRoutine}</pre>
            </div>
            <p>¡Disfruta tu entrenamiento!</p>
            <p><em>El equipo de GymFlow</em></p>
          </body>
        </html>
      `,
    };
    const result = await sendEmail(emailInput);
    if (!result.success) {
        return { error: result.message || "Ocurrió un error desconocido al enviar el correo." };
    }
    return result;
  } catch (error) {
    console.error("Error sending workout by email:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
    return { error: `Error al procesar el envío de la rutina por correo: ${errorMessage} Por favor, inténtalo de nuevo.` };
  }
}
