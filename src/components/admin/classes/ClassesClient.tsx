
"use client";

import { useState } from "react";
import type { ClassSchedule } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react"; // Added Loader2
import { ClassesTable } from "./ClassesTable";
import { ClassFormDialog } from "./ClassFormDialog";
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
import { useClassSchedules } from "@/hooks/useClassSchedules"; // Import useClassSchedules
import { useToast } from "@/hooks/use-toast";

export function ClassesClient() {
  const { 
    classes, 
    addClass, 
    updateClass, 
    deleteClass: deleteClassFromContext, // Renamed to avoid conflict
    isLoading: isLoadingContext 
  } = useClassSchedules();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  const handleAddClass = (newClassData: Omit<ClassSchedule, 'id'>) => {
    addClass(newClassData);
    toast({ title: "Clase Añadida", description: `La clase "${newClassData.name}" ha sido creada.` });
  };

  const handleUpdateClass = (updatedClassData: ClassSchedule) => {
    updateClass(updatedClassData);
    toast({ title: "Clase Actualizada", description: `La clase "${updatedClassData.name}" ha sido actualizada.` });
  };

  const handleDeleteClass = () => {
    if (deletingClassId) {
      const classToDelete = classes.find(c => c.id === deletingClassId);
      deleteClassFromContext(deletingClassId);
      setDeletingClassId(null);
      if (classToDelete) {
        toast({ title: "Clase Eliminada", description: `La clase "${classToDelete.name}" ha sido eliminada.`, variant: "destructive" });
      }
    }
  };

  const openFormForEdit = (classItem: ClassSchedule) => {
    setEditingClass(classItem);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingClass(null);
    setIsFormOpen(true);
  };
  
  const openDeleteConfirm = (classId: string) => {
    setDeletingClassId(classId);
  };

  if (isLoadingContext) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando clases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openFormForAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Clase
        </Button>
      </div>
      
      <ClassesTable
        classes={classes} // Use classes from context
        onEdit={openFormForEdit}
        onDelete={openDeleteConfirm}
      />

      <ClassFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        classItem={editingClass}
        onSubmit={editingClass ? handleUpdateClass : handleAddClass}
      />

      <AlertDialog open={!!deletingClassId} onOpenChange={(isOpen) => !isOpen && setDeletingClassId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la clase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingClassId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
