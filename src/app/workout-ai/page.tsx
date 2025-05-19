import { WorkoutAIClient } from "@/components/workout-ai/WorkoutAIClient";

export default function WorkoutAIPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Planificador de Entrenamiento IA</h1>
      <WorkoutAIClient />
    </div>
  );
}
