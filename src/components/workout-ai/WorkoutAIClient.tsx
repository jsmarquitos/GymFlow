"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getAIWorkoutSuggestion } from "@/app/workout-ai/actions";
import type { SuggestWorkoutRoutineOutput } from "@/ai/flows/suggest-workout-routine";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wand2, AlertTriangle } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const workoutFormSchema = z.object({
  fitnessGoal: z.string().min(3, { message: "Fitness goal must be at least 3 characters." }).max(100),
  preferredActivities: z.string().min(3, { message: "Preferred activities must be at least 3 characters." }).max(200),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

export function WorkoutAIClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestWorkoutRoutineOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const result = await getAIWorkoutSuggestion(data);

    if ("error" in result) {
      setError(result.error);
    } else {
      setSuggestion(result);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="mr-2 h-6 w-6 text-accent" />
                Personalized Workout Suggestion
              </CardTitle>
              <CardDescription>
                Tell us your goals and preferences, and our AI will suggest a workout routine for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fitnessGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="fitnessGoal">Fitness Goal</FormLabel>
                    <FormControl>
                      <Input
                        id="fitnessGoal"
                        placeholder="e.g., Weight loss, Muscle gain, Endurance"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      What do you want to achieve?
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
                    <FormLabel htmlFor="preferredActivities">Preferred Activities</FormLabel>
                    <FormControl>
                      <Textarea
                        id="preferredActivities"
                        placeholder="e.g., Running, Swimming, Weightlifting, Yoga"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                     <FormDescription>
                      What kind of activities do you enjoy?
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
                    Generating...
                  </>
                ) : (
                  "Get Suggestion"
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
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {suggestion && (
        <Card className="shadow-lg bg-secondary">
          <CardHeader>
            <CardTitle className="text-xl text-secondary-foreground">Your AI-Suggested Workout Routine</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-secondary-foreground p-4 bg-background rounded-md font-mono overflow-x-auto">
              {suggestion.workoutRoutine}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
