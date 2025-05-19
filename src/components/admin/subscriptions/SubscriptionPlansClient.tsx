"use client";

import { useState } from "react";
import type { SubscriptionPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { SubscriptionPlanCard } from "./SubscriptionPlanCard";
import { SubscriptionPlanFormDialog } from "./SubscriptionPlanFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubscriptionPlansClientProps {
  initialPlans: SubscriptionPlan[];
}

export function SubscriptionPlansClient({ initialPlans }: SubscriptionPlansClientProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const handleAddPlan = (plan: Omit<SubscriptionPlan, 'id'>) => {
    setPlans(prev => [...prev, { ...plan, id: `plan_${Date.now()}` }]);
  };

  const handleUpdatePlan = (updatedPlan: SubscriptionPlan) => {
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  };

  const handleDeletePlan = () => {
    if (deletingPlanId) {
      setPlans(prev => prev.filter(p => p.id !== deletingPlanId));
      setDeletingPlanId(null);
    }
  };

  const openFormForEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingPlan(null);
    setIsFormOpen(true);
  };
  
  const openDeleteConfirm = (planId: string) => {
    setDeletingPlanId(planId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openFormForAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Plan
        </Button>
      </div>
      
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <SubscriptionPlanCard 
              key={plan.id} 
              plan={plan} 
              onEdit={() => openFormForEdit(plan)}
              onDelete={() => openDeleteConfirm(plan.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No hay planes de suscripción definidos.</p>
      )}

      <SubscriptionPlanFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        plan={editingPlan}
        onSubmit={editingPlan ? handleUpdatePlan : handleAddPlan}
      />

      <AlertDialog open={!!deletingPlanId} onOpenChange={(isOpen) => !isOpen && setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el plan de suscripción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPlanId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
