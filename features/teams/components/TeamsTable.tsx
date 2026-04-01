"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Users,
  Shield,
  Edit2,
  Trash2,
  MoreVertical,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TeamWithManager, deleteTeamAction } from "../actions/teamActions";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Loader2 } from "lucide-react";
import { TeamDialog } from "./TeamDialog";
import { TeamMembersDialog } from "./TeamMembersDialog";

interface TeamsTableProps {
  teams: TeamWithManager[];
  potentialManagers: { id: string; full_name: string | null }[];
}

export function TeamsTable({
  teams: initialTeams,
  potentialManagers,
}: TeamsTableProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithManager | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamWithManager | null>(
    null,
  );
  const [viewingTeam, setViewingTeam] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDelete = async () => {
    if (!teamToDelete) return;

    setIsDeleting(true);
    const result = await deleteTeamAction(teamToDelete.id);
    if (result.success) {
      toast.success(`ลบทีม ${teamToDelete.name} เรียบร้อยแล้ว`);
      setTeams(teams.filter((t) => t.id !== teamToDelete.id));
    } else {
      toast.error(result.message || "ไม่สามารถลบทีมได้");
    }
    setIsDeleting(false);
    setTeamToDelete(null);
  };

  const openEditDialog = (team: TeamWithManager) => {
    setEditingTeam(team);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTeam(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button
          onClick={openCreateDialog}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          สร้างทีมใหม่
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-4 px-6 font-bold text-slate-900">
                ชื่อทีม
              </TableHead>
              <TableHead className="py-4 px-6 font-bold text-slate-900">
                หัวหน้าทีม (Manager)
              </TableHead>
              <TableHead className="py-4 px-6 font-bold text-slate-900">
                จำนวนสมาชิก
              </TableHead>
              <TableHead className="py-4 px-6 font-bold text-slate-900">
                วันที่สร้าง
              </TableHead>
              <TableHead className="py-4 px-6 text-right font-bold text-slate-900">
                การจัดการ
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-slate-900">
                        ยังไม่มีข้อมูลทีมในระบบ
                      </p>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        เริ่มสร้างทีมแรกของคุณเพื่อจัดการสิทธิ์และแบ่งสายงานให้กับพนักงานของคุณ
                      </p>
                    </div>
                    <Button
                      onClick={openCreateDialog}
                      className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      สร้างทีมแรกของคุณ
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow
                  key={team.id}
                  className="group hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="font-bold text-slate-800">
                        {team.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    {team.manager ? (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-indigo-500" />
                        <span className="font-medium text-slate-700">
                          {team.manager.full_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-sm">
                        ยังไม่ได้ระบุ
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {team.agent_count || 0} คน
                    </span>
                  </TableCell>
                  <TableCell className="px-6 text-slate-400 text-sm">
                    {formatDate(team.created_at || "")}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-xl border-slate-100"
                      >
                        <DropdownMenuItem
                          onClick={() => openEditDialog(team)}
                          className="flex items-center gap-2 py-2.5 cursor-pointer text-slate-700"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span>แก้ไขข้อมูล</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setViewingTeam({ id: team.id, name: team.name })
                          }
                          className="flex items-center gap-2 py-2.5 cursor-pointer text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Users className="h-4 w-4" />
                          <span>ดูสมาชิกในทีม</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTeamToDelete(team)}
                          className="flex items-center gap-2 py-2.5 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>ลบทีม</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TeamDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        team={editingTeam}
        potentialManagers={potentialManagers}
        onSuccess={(updatedTeam: any) => {
          if (editingTeam) {
            setTeams(
              teams.map((t) =>
                t.id === updatedTeam.id ? { ...t, ...updatedTeam } : t,
              ),
            );
          } else {
            setTeams([updatedTeam, ...teams]);
          }
        }}
      />

      <TeamMembersDialog
        isOpen={!!viewingTeam}
        onClose={() => setViewingTeam(null)}
        teamId={viewingTeam?.id || ""}
        teamName={viewingTeam?.name || ""}
      />

      <ResponsiveDialog
        open={!!teamToDelete}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        title="ยืนยันการลบทีม"
        description={
          teamToDelete ? (
            <div className="flex flex-col gap-2">
              <p>คุณกำลังจะลบทีม <strong className="text-slate-900">{teamToDelete.name}</strong> ใช่หรือไม่?</p>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] text-amber-700 font-bold leading-relaxed">
                ⚠️ พนักงานทุกคนในทีมจะถูกปลดออกจากสังกัดทีมนี้โดยอัตโนมัติ การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </div>
            </div>
          ) : ""
        }
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setTeamToDelete(null)}
              disabled={isDeleting}
              className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
              className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ยืนยันการลบทีม"
              )}
            </Button>
          </div>
        }
      />
    </div>
  );
}
