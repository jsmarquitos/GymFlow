"use server";

import { suggestWorkoutRoutine, type SuggestWorkoutRoutineInput, type SuggestWorkoutRoutineOutput } from '@/ai/flows/suggest-workout-routine';

export async function getAIWorkoutSuggestion(input: SuggestWorkoutRoutineInput): Promise<SuggestWorkoutRoutineOutput | { error: string }> {
  try {
    const result = await suggestWorkoutRoutine(input);
    return result;
  } catch (error) {
    console.error("Error getting AI workout suggestion:", error);
    // It's good practice to not expose raw error messages to the client.
    // Log the detailed error on the server and return a generic message.
    return { error: "Failed to generate workout suggestion. Please try again." };
  }
}
