import { ScheduleView } from "@/components/schedule/ScheduleView";

export default function SchedulePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Horario de Clases</h1>
      <ScheduleView />
    </div>
  );
}
