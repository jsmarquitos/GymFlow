
"use client";

import type { Routine, AdminMember } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal, User, CalendarRange, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/constants";

interface RoutineManagementTableProps {
  routines: Routine[];
  availableMembers: AdminMember[];
  onEdit: (routine: Routine) => void;
  onDelete: (routineId: string) => void;
}

export function RoutineManagementTable({ routines, availableMembers, onEdit, onDelete }: RoutineManagementTableProps) {
  
  const getMemberName = (memberId: string | null) => {
    if (!memberId) return <Badge variant="outline">Plantilla</Badge>;
    const member = availableMembers.find(m => m.id === memberId);
    return member ? <Badge variant="secondary">{member.name}</Badge> : <Badge variant="outline">Desconocido</Badge>;
  };

  if (routines.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay rutinas creadas.</p>;
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableCaption>Lista de rutinas de entrenamiento creadas en el sistema.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre de la Rutina</TableHead>
            <TableHead>Asignada a</TableHead>
            <TableHead>Creada por</TableHead>
            <TableHead>Periodo</TableHead>
            <TableHead>Días</TableHead>
            <TableHead className="text-right w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routines.map((routine) => (
            <TableRow key={routine.id}>
              <TableCell className="font-medium flex items-center">
                <Info className="mr-2 h-4 w-4 text-primary" />
                {routine.name}
              </TableCell>
              <TableCell>{getMemberName(routine.assignedToMemberId)}</TableCell>
              <TableCell>
                <Badge variant="outline">{routine.assignedByInstructorName}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-xs">
                  <CalendarRange className="mr-1 h-3 w-3" />
                  {formatDate(routine.startDate, "dd/MM/yy")} - {formatDate(routine.endDate, "dd/MM/yy")}
                </div>
              </TableCell>
              <TableCell>{routine.days.length}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(routine)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(routine.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
