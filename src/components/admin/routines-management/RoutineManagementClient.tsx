
"use client";

import { useState } from "react";
import type { Routine, AdminMember } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { RoutineManagementTable } from "./RoutineManagementTable";
import { RoutineFormDialog } from "./RoutineFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRoutines } from "@/hooks/useRoutines";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface RoutineManagementClientProps {
  availableMembers: AdminMember[];
}

export function RoutineManagementClient({ availableMembers }: RoutineManagementClientProps) {
  const { routines, addRoutine, updateRoutine, deleteRoutine: deleteRoutineFromContext, isLoading } = useRoutines();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);

  const instructorName = user?.email || "Instructor Desconocido"; // o un nombre más formal si lo tienes

  const handleAddRoutineSubmit = (
    newRoutineData: Omit<Routine, 'id' | 'days' | 'assignedByInstructorName'> & { 
      days: Array<Omit<import('@/types').RoutineDay, 'id' | 'exercises'> & { 
        exercises: Array<Omit<import('@/types').RoutineExercise, 'id'>> 
      }> 
    }
  ) => {
    addRoutine({ ...newRoutineData, assignedByInstructorName: instructorName });
    toast({ title: "Rutina Añadida", description: `La rutina "${newRoutineData.name}" ha sido creada.` });
  };

  const handleUpdateRoutineSubmit = (updatedRoutineData: Routine) => {
    // Asegurarse que assignedByInstructorName no se borre si no se edita explícitamente
    const routineWithInstructor = {
      ...updatedRoutineData,
      assignedByInstructorName: updatedRoutineData.assignedByInstructorName || instructorName,
    };
    updateRoutine(routineWithInstructor);
    toast({ title: "Rutina Actualizada", description: `La rutina "${updatedRoutineData.name}" ha sido actualizada.` });
  };

  const handleDeleteRoutine = () => {
    if (deletingRoutineId) {
      const routineToDelete = routines.find(r => r.id === deletingRoutineId);
      deleteRoutineFromContext(deletingRoutineId);
      setDeletingRoutineId(null);
      if (routineToDelete) {
        toast({ title: "Rutina Eliminada", description: `La rutina "${routineToDelete.name}" ha sido eliminada.`, variant: "destructive" });
      }
    }
  };

  const openFormForEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingRoutine(null);
    setIsFormOpen(true);
  };

  const openDeleteConfirm = (routineId: string) => {
    setDeletingRoutineId(routineId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando rutinas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openFormForAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nueva Rutina
        </Button>
      </div>

      <RoutineManagementTable
        routines={routines}
        availableMembers={availableMembers}
        onEdit={openFormForEdit}
        onDelete={openDeleteConfirm}
      />

      <RoutineFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        routine={editingRoutine}
        availableMembers={availableMembers}
        onSubmit={editingRoutine ? handleUpdateRoutineSubmit : handleAddRoutineSubmit}
        instructorName={instructorName}
      />

      <AlertDialog open={!!deletingRoutineId} onOpenChange={(isOpen) => !isOpen && setDeletingRoutineId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la rutina.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingRoutineId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoutine} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
