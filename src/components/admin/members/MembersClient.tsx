"use client";

import { useState } from "react";
import type { AdminMember, SubscriptionPlan } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MembersTable } from "./MembersTable";
import { MemberFormDialog } from "./MemberFormDialog";
import { MOCK_ADMIN_MEMBERS, MOCK_SUBSCRIPTION_PLANS } from "@/lib/constants"; // For initial state if needed or for reset

interface MembersClientProps {
  initialMembers: AdminMember[];
  availablePlans: SubscriptionPlan[];
}

export function MembersClient({ initialMembers, availablePlans }: MembersClientProps) {
  const [members, setMembers] = useState<AdminMember[]>(initialMembers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AdminMember | null>(null);

  const handleAddMember = (member: AdminMember) => {
    // En una app real, esto sería una llamada API
    setMembers(prev => [...prev, { ...member, id: `member_${Date.now()}` }]);
  };

  const handleUpdateMember = (updatedMember: AdminMember) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const handleDeleteMember = (memberId: string) => {
    // Confirmación y llamada API en app real
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const openFormForEdit = (member: AdminMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const openFormForAdd = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openFormForAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Miembro
        </Button>
      </div>
      <MembersTable
        members={members}
        availablePlans={availablePlans}
        onEdit={openFormForEdit}
        onDelete={handleDeleteMember}
      />
      <MemberFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        member={editingMember}
        availablePlans={availablePlans}
        onSubmit={editingMember ? handleUpdateMember : handleAddMember}
      />
    </div>
  );
}
