
"use client";

import { useState, useEffect } from "react";
import type { User, Routine, RoutineDay, RoutineExercise, MemberProfile } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_MEMBER_VIEW_ROUTINE, MOCK_MEMBER_PROFILE } from "@/lib/constants"; // Updated import
import { RoutineDisplay } from "./RoutineDisplay";
import { Loader2, Frown, Info } from "lucide-react"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 

export function MemberRoutineClient() {
  const { user, isLoading: authLoading } = useAuth();
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [routineDays, setRoutineDays] = useState<RoutineDay[]>([]);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true); 
    if (!authLoading) {
      if (user && user.email === MOCK_MEMBER_PROFILE.email) { 
        setMemberProfile(MOCK_MEMBER_PROFILE);
      } else if (user && user.role === 'member') {
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
        setMemberProfile(null); 
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (memberProfile) {
      // Use MOCK_MEMBER_VIEW_ROUTINE if the profile matches
      if (memberProfile.id === MOCK_MEMBER_PROFILE.id && MOCK_MEMBER_VIEW_ROUTINE.assignedToMemberId === MOCK_MEMBER_PROFILE.id) {
        const assignedRoutine = MOCK_MEMBER_VIEW_ROUTINE;
        setRoutine(assignedRoutine);
        // Extract days and exercises from the nested structure
        const days = assignedRoutine.days.sort((a,b) => a.order - b.order);
        setRoutineDays(days);
        const exercises = days.flatMap(day => day.exercises.map(ex => ({...ex, routineDayId: day.id }))).sort((a,b) => a.order - b.order); // Add routineDayId if needed by RoutineDisplay, sort by order
        setRoutineExercises(exercises);
      } else {
        setRoutine(null); // No routine found for this member or profile doesn't match
        setRoutineDays([]);
        setRoutineExercises([]);
      }
    } else if (!authLoading && user && user.role === 'member'){ 
        setRoutine(null);
        setRoutineDays([]);
        setRoutineExercises([]);
    }
     setIsLoading(false); 
  }, [memberProfile, authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando tus rutinas...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'member' && user.role !== 'instructor')) { 
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
