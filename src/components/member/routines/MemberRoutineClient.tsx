
"use client";

import { useState, useEffect } from "react";
import type { User, Routine, RoutineDay, RoutineExercise, MemberProfile } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_ROUTINES, MOCK_ROUTINE_DAYS, MOCK_ROUTINE_EXERCISES, MOCK_MEMBER_PROFILE } from "@/lib/constants";
import { RoutineDisplay } from "./RoutineDisplay";
import { Loader2, Frown, Info } from "lucide-react"; // Added Info
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components

export function MemberRoutineClient() {
  const { user, isLoading: authLoading } = useAuth();
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineDays, setRoutineDays] = useState<RoutineDay[]>([]);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true); // Start loading when auth state might change
    if (!authLoading) {
      if (user && user.email === MOCK_MEMBER_PROFILE.email) { // Simulate fetching profile for current user
        setMemberProfile(MOCK_MEMBER_PROFILE);
      } else if (user && user.role === 'member') {
         // For other members, show no routine assigned for now.
        setMemberProfile({
          id: user.email || `member_${Date.now()}`,
          name: "Miembro Estándar",
          email: user.email || "miembro@example.com",
          membershipType: "Estándar",
          joinDate: new Date().toISOString().split('T')[0],
          bookings: [],
          profilePictureUrl: "https://placehold.co/150x150.png",
          profilePictureHint: "persona avatar",
        });
      } else {
        setMemberProfile(null); // Clear profile if not a member or no user
      }
      // setIsLoading(false); // Moved to the next useEffect to ensure data is fetched based on profile
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (memberProfile) {
      // Simulate fetching routine assigned to this member
      const assignedRoutine = MOCK_ROUTINES.find(r => r.assignedToMemberId === memberProfile.id);
      if (assignedRoutine) {
        setRoutine(assignedRoutine);
        const days = MOCK_ROUTINE_DAYS.filter(day => day.routineId === assignedRoutine.id).sort((a,b) => a.order - b.order);
        setRoutineDays(days);
        const exercises = MOCK_ROUTINE_EXERCISES.filter(ex => days.map(d => d.id).includes(ex.routineDayId));
        setRoutineExercises(exercises);
      } else {
        setRoutine(null); // No routine found for this member
        setRoutineDays([]);
        setRoutineExercises([]);
      }
    } else if (!authLoading && user && user.role === 'member'){ // User is a member but not MOCK_MEMBER_PROFILE
        setRoutine(null);
        setRoutineDays([]);
        setRoutineExercises([]);
    }
     setIsLoading(false); // Stop loading after attempting to fetch/set routines
  }, [memberProfile, authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando tus rutinas...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'member' && user.role !== 'instructor')) { // Instructors might view their own routines in future
    return (
        <Alert variant="destructive" className="max-w-md mx-auto">
          <Frown className="h-5 w-5" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            Debes iniciar sesión como miembro para ver esta sección. Los instructores y administradores no tienen rutinas personales asignadas en esta vista.
          </AlertDescription>
        </Alert>
    );
  }
  
  if (!routine && user.role === 'member') {
    return (
        <Alert className="max-w-lg mx-auto">
            <Info className="h-5 w-5" />
            <AlertTitle>No Tienes Rutinas Asignadas</AlertTitle>
            <AlertDescription>
                Parece que aún no tienes una rutina de entrenamiento asignada. ¡Contacta a tu instructor para que te cree una y puedas verla aquí!
            </AlertDescription>
        </Alert>
    );
  }
  // Instructors might see a different message or UI in the future. For now, if they land here and have no routine, it's fine.
  if (!routine && user.role === 'instructor') {
    return (
        <Alert className="max-w-lg mx-auto">
            <Info className="h-5 w-5" />
            <AlertTitle>Vista de Rutinas (Instructores)</AlertTitle>
            <AlertDescription>
                Como instructor, esta página mostraría tus propias rutinas si estuvieran implementadas. La asignación de rutinas a miembros se gestionará desde el panel de administración.
            </AlertDescription>
        </Alert>
    );
  }


  return routine ? <RoutineDisplay routine={routine} days={routineDays} exercises={routineExercises} /> : null;
}
