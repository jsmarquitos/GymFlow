"use client";

import Image from "next/image";
import type { AdminMember, SubscriptionPlan } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/constants";

interface MembersTableProps {
  members: AdminMember[];
  availablePlans: SubscriptionPlan[];
  onEdit: (member: AdminMember) => void;
  onDelete: (memberId: string) => void;
}

export function MembersTable({ members, availablePlans, onEdit, onDelete }: MembersTableProps) {
  const getPlanName = (planId: string | null) => {
    if (!planId) return <Badge variant="outline">Sin Plan</Badge>;
    const plan = availablePlans.find(p => p.id === planId);
    return plan ? <Badge variant="secondary">{plan.name}</Badge> : <Badge variant="outline">Desconocido</Badge>;
  };

  const getStatusBadge = (status: AdminMember["status"]) => {
    return (
      <Badge
        variant={
          status === "Activo" ? "default" :
          status === "Inactivo" ? "outline" :
          "destructive"
        }
        className={cn(
          status === "Activo" && "bg-green-500/80 text-white",
          status === "Inactivo" && "border-yellow-500 text-yellow-600",
          status === "Suspendido" && "bg-red-500/80 text-white"
        )}
      >
        {status}
      </Badge>
    );
  };

  if (members.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay miembros registrados.</p>;
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableCaption>Lista de miembros registrados en el sistema.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Plan Actual</TableHead>
            <TableHead>Fecha de Ingreso</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="relative w-10 h-10 rounded-full overflow-hidden border">
                  {member.profilePictureUrl ? (
                     <Image
                        src={member.profilePictureUrl}
                        alt={member.name}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={member.profilePictureHint || "persona avatar"}
                      />
                  ) : (
                    <UserCircle className="w-full h-full text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{getPlanName(member.subscriptionPlanId)}</TableCell>
              <TableCell>{formatDate(member.joinDate)}</TableCell>
              <TableCell>{getStatusBadge(member.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(member)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(member.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
