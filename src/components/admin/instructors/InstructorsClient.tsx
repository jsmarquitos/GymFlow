
"use client";

import { useState } from "react";
import type { Instructor } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { InstructorsTable } from "./InstructorsTable";
import { InstructorFormDialog } from "./InstructorFormDialog";
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
import { useInstructors } from "@/hooks/useInstructors";
import { useToast } from "@/hooks/use-toast";

export function InstructorsClient() {
  const { 
    instructors, 
    addInstructor, 
    updateInstructor, 
    deleteInstructor: deleteInstructorFromContext, 
    isLoading 
  } = useInstructors();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);
  const [deletingInstructorId, setDeletingInstructorId] = useState<string | null>(null);

  const handleAddInstructorSubmit = (newInstructorData: Omit<Instructor, 'id'>) => {
    addInstructor(newInstructorData);
    toast({ title: "Instructor Añadido", description: `El instructor "${newInstructorData.name}" ha sido creado.` });
  };

  const handleUpdateInstructorSubmit = (updatedInstructorData: Instructor) => {
    updateInstructor(updatedInstructorData);
    toast({ title: "Instructor Actualizado", description: `El instructor "${updatedInstructorData.name}" ha sido actualizado.` });
  };

  const handleDeleteInstructor = () => {
    if (deletingInstructorId) {
      const instructorToDelete = instructors.find(i => i.id === deletingInstructorId);
      deleteInstructorFromContext(deletingInstructorId);
      setDeletingInstructorId(null);
      if (instructorToDelete) {
        toast({ title: "Instructor Eliminado", description: `El instructor "${instructorToDelete.name}" ha sido eliminado.`, variant: "destructive" });
      }
    }
  };

  const openFormForEdit = (instructor: Instructor) => {
    setEditingInstructor(instructor);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingInstructor(null);
    setIsFormOpen(true);
  };

  const openDeleteConfirm = (instructorId: string) => {
    setDeletingInstructorId(instructorId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando instructores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openFormForAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Instructor
        </Button>
      </div>

      <InstructorsTable
        instructors={instructors}
        onEdit={openFormForEdit}
        onDelete={openDeleteConfirm}
      />

      <InstructorFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        instructor={editingInstructor}
        onSubmit={editingInstructor ? handleUpdateInstructorSubmit : handleAddInstructorSubmit}
      />

      <AlertDialog open={!!deletingInstructorId} onOpenChange={(isOpen) => !isOpen && setDeletingInstructorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al instructor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingInstructorId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInstructor} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
