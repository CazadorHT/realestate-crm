"use client";

import React, { useState } from "react";
import { TeamWithManager, deleteTeamAction } from "@/features/teams/actions/teamActions";
import { TeamFormDialog } from "./TeamFormDialog";
import { TeamManagementTable } from "./TeamManagementTable";
import { TeamMembersDialog } from "@/features/teams/components/TeamMembersDialog";
import { DeleteConfirmationDialog } from "@/components/settings/branches/DeleteConfirmationDialog";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/language-context";

interface TeamDialogOrchestratorProps {
  initialTeams: TeamWithManager[];
  potentialManagers: { id: string; full_name: string | null; avatar_url: string | null }[];
  fetchedWithError?: boolean;
}

export function TeamDialogOrchestrator({
  initialTeams,
  potentialManagers,
  fetchedWithError = false,
}: TeamDialogOrchestratorProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [teams, setTeams] = useState(initialTeams);
  
  // Sync teams when initialTeams changes (e.g. after refresh)
  React.useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);
  const [editingTeam, setEditingTeam] = useState<TeamWithManager | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingMembers, setViewingMembers] = useState<{ id: string; name: string } | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<TeamWithManager | null>(null);

  // --- Handlers ---
  const handleCreate = () => {
    setEditingTeam(null);
    setIsFormOpen(true);
  };

  const handleEdit = (team: TeamWithManager) => {
    setEditingTeam(team);
    setIsFormOpen(true);
  };

  // --- Listeners ---
  React.useEffect(() => {
    const handleTriggerCreate = () => handleCreate();
    window.addEventListener("trigger-create-team", handleTriggerCreate);
    return () => window.removeEventListener("trigger-create-team", handleTriggerCreate);
  }, []);

  const handleSuccess = (updatedTeam: TeamWithManager) => {
    if (editingTeam) {
      setTeams(prev => prev.map(t => (t.id === updatedTeam.id ? updatedTeam : t)));
    } else {
      setTeams(prev => [updatedTeam, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!deletingTeam) return;

    const res = await deleteTeamAction(deletingTeam.id);
    if (res.success) {
      toast.success(
        isEn 
          ? `Team ${deletingTeam.name} deleted and members unassigned successfully` 
          : `ลบทีม ${deletingTeam.name} และปลดสมาชิกออกจากทีมเรียบร้อยแล้ว`
      );
      setTeams(prev => prev.filter(t => t.id !== deletingTeam.id));
      setDeletingTeam(null);
    } else {
      toast.error(res.message || (isEn ? "Failed to delete team" : "ไม่สามารถลบทีมได้"));
    }
  };

  return (
    <>
      <TeamManagementTable 
        teams={teams}
        fetchedWithError={fetchedWithError}
        onEdit={handleEdit}
        onDelete={setDeletingTeam}
        onViewMembers={(t) => setViewingMembers({ id: t.id, name: t.name })}
        onCreate={handleCreate}
      />

      {/* 🧩 Specialized Modals */}
      <TeamFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        team={editingTeam}
        potentialManagers={potentialManagers}
        onSuccess={handleSuccess}
      />

      <TeamMembersDialog
        isOpen={!!viewingMembers}
        onClose={() => setViewingMembers(null)}
        teamId={viewingMembers?.id || ""}
        teamName={viewingMembers?.name || ""}
      />

      <DeleteConfirmationDialog 
        open={!!deletingTeam}
        onOpenChange={(val) => !val && setDeletingTeam(null)}
        title={isEn ? "Confirm Delete Team" : "ยืนยันการลบทีม"}
        description={
            deletingTeam ? (
                <>
                    {isEn ? "Are you sure you want to delete team " : "คุณกำลังจะลบทีม "}
                    <strong className="text-slate-900">{deletingTeam.name}</strong>?
                    <br />
                    <span className="text-rose-500 font-bold mt-2 block">
                        {isEn 
                          ? "⚠️ All team members will be unassigned to 'Unassigned' status" 
                          : "⚠️ สมาชิกทั้งหมดในทีมจะถูกปลดออกเป็นสถานะ \"ยังไม่มีสังกัดทีม\""}
                    </span>
                </>
            ) : ""
        }
        onConfirm={handleDelete}
      />
    </>
  );
}

