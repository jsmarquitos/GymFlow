// src/ai/flows/suggest-workout-routine.ts
'use server';

/**
 * @fileOverview Provides personalized workout routine suggestions based on user fitness goals and preferred activities.
 *
 * - suggestWorkoutRoutine - A function that suggests a workout routine.
 * - SuggestWorkoutRoutineInput - The input type for the suggestWorkoutRoutine function.
 * - SuggestWorkoutRoutineOutput - The return type for the suggestWorkoutRoutine function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWorkoutRoutineInputSchema = z.object({
  fitnessGoal: z
    .string()
    .describe('The fitness goal of the user (e.g., weight loss, muscle gain, endurance).'),
  preferredActivities: z
    .string()
    .describe('The preferred activities of the user (e.g., running, swimming, weightlifting).'),
});
export type SuggestWorkoutRoutineInput = z.infer<typeof SuggestWorkoutRoutineInputSchema>;

const SuggestWorkoutRoutineOutputSchema = z.object({
  workoutRoutine: z
    .string()
    .describe(
      'A personalized workout routine that includes a list of exercises, sets, reps, and rest times, tailored to the user fitness goal and preferred activities. The response must be in Spanish.'
    ),
});
export type SuggestWorkoutRoutineOutput = z.infer<typeof SuggestWorkoutRoutineOutputSchema>;

export async function suggestWorkoutRoutine(
  input: SuggestWorkoutRoutineInput
): Promise<SuggestWorkoutRoutineOutput> {
  return suggestWorkoutRoutineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWorkoutRoutinePrompt',
  input: {schema: SuggestWorkoutRoutineInputSchema},
  output: {schema: SuggestWorkoutRoutineOutputSchema},
  prompt: `Eres un entrenador personal que sugiere rutinas de entrenamiento.

  Basándote en el objetivo de fitness y las actividades preferidas del usuario, sugiere una rutina de entrenamiento.

  **IMPORTANTE: Toda tu respuesta debe estar en idioma español.**

  Objetivo de Fitness: {{{fitnessGoal}}}
  Actividades Preferidas: {{{preferredActivities}}}
  `,
});

const suggestWorkoutRoutineFlow = ai.defineFlow(
  {
    name: 'suggestWorkoutRoutineFlow',
    inputSchema: SuggestWorkoutRoutineInputSchema,
    outputSchema: SuggestWorkoutRoutineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
