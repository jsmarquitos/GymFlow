
"use client";

import { useState } from "react";
import type { PaymentRecord, AdminMember } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { PaymentsTable } from "./PaymentsTable";
import { PaymentFormDialog } from "./PaymentFormDialog";
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

interface PaymentsClientProps {
  initialPayments: PaymentRecord[];
  members: AdminMember[]; // Para el selector en el formulario
}

export function PaymentsClient({ initialPayments, members }: PaymentsClientProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const handleAddPayment = (newPayment: Omit<PaymentRecord, 'id' | 'memberName'>) => {
    const member = members.find(m => m.id === newPayment.memberId);
    const paymentWithDetails: PaymentRecord = {
      ...newPayment,
      id: `pay_${Date.now()}`,
      memberName: member ? member.name : "Desconocido",
    };
    setPayments(prev => [paymentWithDetails, ...prev].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
  };
  
  const handleUpdatePayment = (updatedPayment: PaymentRecord) => {
     const member = members.find(m => m.id === updatedPayment.memberId);
     const paymentWithDetails = {
      ...updatedPayment,
      memberName: member ? member.name : updatedPayment.memberName, // Mantener si no se encuentra
     };
    setPayments(prev => prev.map(p => p.id === paymentWithDetails.id ? paymentWithDetails : p).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
  };

  const handleDeletePayment = () => {
    if (deletingPaymentId) {
      setPayments(prev => prev.filter(p => p.id !== deletingPaymentId));
      setDeletingPaymentId(null);
    }
  };

  const openFormForEdit = (paymentItem: PaymentRecord) => {
    setEditingPayment(paymentItem);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingPayment(null);
    setIsFormOpen(true);
  };
  
  const openDeleteConfirm = (paymentId: string) => {
    setDeletingPaymentId(paymentId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openFormForAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Pago
        </Button>
      </div>
      
      <PaymentsTable
        payments={payments}
        onEdit={openFormForEdit}
        onDelete={openDeleteConfirm}
      />

      <PaymentFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        paymentItem={editingPayment}
        members={members}
        onSubmit={editingPayment ? handleUpdatePayment : handleAddPayment}
      />

      <AlertDialog open={!!deletingPaymentId} onOpenChange={(isOpen) => !isOpen && setDeletingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de pago.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPaymentId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
