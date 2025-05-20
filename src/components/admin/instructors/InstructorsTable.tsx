
"use client";

import Image from "next/image";
import type { Instructor } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal, UserCircle, Mail, BrainCircuit, CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/constants";

interface InstructorsTableProps {
  instructors: Instructor[];
  onEdit: (instructor: Instructor) => void;
  onDelete: (instructorId: string) => void;
}

export function InstructorsTable({ instructors, onEdit, onDelete }: InstructorsTableProps) {
  if (instructors.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No hay instructores registrados.</p>;
  }

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableCaption>Lista de instructores registrados en el sistema.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Especialización</TableHead>
            <TableHead>Fecha de Ingreso</TableHead>
            <TableHead className="text-right w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructors.map((instructor) => (
            <TableRow key={instructor.id}>
              <TableCell>
                <div className="relative w-10 h-10 rounded-full overflow-hidden border">
                  {instructor.profilePictureUrl ? (
                     <Image
                        src={instructor.profilePictureUrl}
                        alt={instructor.name}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={instructor.profilePictureHint || "persona retrato"}
                      />
                  ) : (
                    <UserCircle className="w-full h-full text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{instructor.name}</TableCell>
              <TableCell>
                <div className="flex items-center text-xs">
                  <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                  {instructor.email}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-xs">
                  <BrainCircuit className="mr-1 h-3 w-3 text-muted-foreground" />
                  {instructor.specialization}
                </div>
              </TableCell>
              <TableCell>
                 <div className="flex items-center text-xs">
                  <CalendarDays className="mr-1 h-3 w-3 text-muted-foreground" />
                  {formatDate(instructor.joinDate)}
                </div>
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
                    <DropdownMenuItem onClick={() => onEdit(instructor)}>
                      <Edit className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(instructor.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
