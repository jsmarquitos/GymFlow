
"use client";

import { useState } from "react";
import type { ClassSchedule } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
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

interface ClassesClientProps {
  initialClasses: ClassSchedule[];
}

export function ClassesClient({ initialClasses }: ClassesClientProps) {
  const [classes, setClasses] = useState<ClassSchedule[]>(initialClasses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  const handleAddClass = (newClass: Omit<ClassSchedule, 'id'>) => {
    setClasses(prev => [...prev, { ...newClass, id: `class_${Date.now()}` }]);
  };

  const handleUpdateClass = (updatedClass: ClassSchedule) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
  };

  const handleDeleteClass = () => {
    if (deletingClassId) {
      setClasses(prev => prev.filter(c => c.id !== deletingClassId));
      setDeletingClassId(null);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openFormForAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Clase
        </Button>
      </div>
      
      <ClassesTable
        classes={classes}
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
