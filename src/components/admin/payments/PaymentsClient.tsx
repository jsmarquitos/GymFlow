
"use client";

import { useState, useMemo } from "react";
import type { PaymentRecord, AdminMember, PaymentMethod, PaymentStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Search } from "lucide-react";
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
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/constants";

interface PaymentsClientProps {
  initialPayments: PaymentRecord[];
  members: AdminMember[]; 
}

export function PaymentsClient({ initialPayments, members }: PaymentsClientProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const [filterMemberName, setFilterMemberName] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<PaymentMethod | "all">("all");
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | "all">("all");

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
      memberName: member ? member.name : updatedPayment.memberName, 
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

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const memberNameMatch = filterMemberName === "" || payment.memberName.toLowerCase().includes(filterMemberName.toLowerCase());
      const paymentMethodMatch = filterPaymentMethod === "all" || payment.paymentMethod === filterPaymentMethod;
      const statusMatch = filterStatus === "all" || payment.status === filterStatus;
      return memberNameMatch && paymentMethodMatch && statusMatch;
    });
  }, [payments, filterMemberName, filterPaymentMethod, filterStatus]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Filtrar por miembro..."
              value={filterMemberName}
              onChange={(e) => setFilterMemberName(e.target.value)}
              className="pl-8 w-full sm:w-[250px]"
            />
          </div>
          <Select value={filterPaymentMethod} onValueChange={(value) => setFilterPaymentMethod(value as PaymentMethod | "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Métodos</SelectItem>
              {PAYMENT_METHODS.map(method => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as PaymentStatus | "all")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado del pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              {PAYMENT_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openFormForAdd} className="w-full sm:w-auto mt-2 sm:mt-0">
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Pago
        </Button>
      </div>
      
      <PaymentsTable
        payments={filteredPayments}
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
