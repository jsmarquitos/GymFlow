import { MemberRoutineClient } from "@/components/member/routines/MemberRoutineClient";

export default function RoutinesPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Mis Rutinas</h1>
      <MemberRoutineClient />
    </div>
  );
}
