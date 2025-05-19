
"use client";

import type { PaymentRecord, PaymentStatus } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/constants";

interface PaymentsTableProps {
  payments: PaymentRecord[];
  onEdit: (paymentItem: PaymentRecord) => void;
  onDelete: (paymentId: string) => void;
}

const getStatusIcon = (status: PaymentStatus) => {
  switch (status) {
    case "Pagado": return <CheckCircle className="mr-1 h-3 w-3" />;
    case "Pendiente": return <Clock className="mr-1 h-3 w-3" />;
    case "Vencido": return <AlertTriangle className="mr-1 h-3 w-3" />;
    case "Cancelado": return <XCircle className="mr-1 h-3 w-3" />;
    default: return null;
  }
};

export function PaymentsTable({ payments, onEdit, onDelete }: PaymentsTableProps) {
  if (payments.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay registros de pago.</p>;
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableCaption>Lista de todos los pagos registrados en el sistema.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Miembro</TableHead>
            <TableHead>Fecha de Pago</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Período Cubierto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.memberName}</TableCell>
              <TableCell>{formatDate(payment.paymentDate)}</TableCell>
              <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
              <TableCell>{payment.paymentMethod}</TableCell>
              <TableCell>{formatDate(payment.coveredPeriodStart)} - {formatDate(payment.coveredPeriodEnd)}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    payment.status === "Pagado" ? "default" :
                    payment.status === "Pendiente" ? "secondary" :
                    payment.status === "Vencido" ? "destructive" :
                    "outline"
                  }
                   className={cn(
                    payment.status === 'Pagado' && 'bg-green-500/80 hover:bg-green-500/70 text-white',
                    payment.status === 'Pendiente' && 'bg-yellow-500/80 hover:bg-yellow-500/70 text-black',
                    payment.status === 'Vencido' && 'bg-red-500/80 hover:bg-red-500/70 text-white',
                    payment.status === 'Cancelado' && 'bg-gray-500/80 hover:bg-gray-500/70 text-white'
                  )}
                >
                  {getStatusIcon(payment.status)}
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(payment)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(payment.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
