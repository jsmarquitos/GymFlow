
"use client";

import Image from "next/image";
import type { ClassSchedule } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal, Info } from "lucide-react";
import { getIconComponent } from "@/lib/icons";

interface ClassesTableProps {
  classes: ClassSchedule[];
  onEdit: (classItem: ClassSchedule) => void;
  onDelete: (classId: string) => void;
}

export function ClassesTable({ classes, onEdit, onDelete }: ClassesTableProps) {
  if (classes.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay clases registradas.</p>;
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableCaption>Lista de clases programadas en el sistema.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Icono</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Horario</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead className="text-center">Cupos (Disp/Total)</TableHead>
            <TableHead className="text-right w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((classItem) => {
            const IconComponent = getIconComponent(classItem.iconName);
            return (
              <TableRow key={classItem.id}>
                <TableCell>
                  <div className="flex justify-center items-center w-8 h-8 rounded-full bg-muted">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{classItem.name}</TableCell>
                <TableCell>{classItem.instructor}</TableCell>
                <TableCell>{classItem.time}</TableCell>
                <TableCell>{classItem.duration}</TableCell>
                <TableCell className="text-center">{`${classItem.availableSlots}/${classItem.totalSlots}`}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(classItem)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(classItem.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
