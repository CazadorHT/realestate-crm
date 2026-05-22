"use client";

import { useState, useEffect, useCallback } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserRoleBadge } from "@/features/users/UserRoleBadge";
import { Users, Briefcase, Trash2, Loader2 } from "lucide-react";

import { 
  getTeamMembersAction,
  updateUserTeamAction 
} from "@/features/teams/actions/teamActions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TeamMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
}
export function TeamMembersDialog({
  isOpen,
  onClose,
  teamId,
  teamName,
}: TeamMembersDialogProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTeamMembersAction(teamId);
      if (result.success) {
        setMembers(result.data || []);
      } else {
        toast.error(result.message || "ไม่สามารถโหลดข้อมูลสมาชิกทีมได้");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (isOpen && teamId) {
      fetchMembers();
    }
  }, [isOpen, teamId, fetchMembers]);

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsRemoving(memberToRemove.id);
    try {
      const result = await updateUserTeamAction(memberToRemove.id, null);
      if (result.success) {
        toast.success(`ถอด ${memberToRemove.full_name} ออกจากทีมแล้ว`);
        setMembers(members.filter((m) => m.id !== memberToRemove.id));
      } else {
        toast.error(result.message || "ไม่สามารถถอดสมาชิกได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsRemoving(null);
      setMemberToRemove(null);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(val) => !val && onClose()}
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 leading-tight">
            สมาชิกในทีม: {teamName}
          </div>
        </div>
      }
      description="รายชื่อเอเจนท์และหัวหน้าที่สังกัดทีมนี้"
      className="md:max-w-2xl"
    >
      <div className="space-y-4 py-2">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                  ชื่อ-นามสกุล
                </TableHead>
                <TableHead className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                  บทบาท
                </TableHead>
                <TableHead className="py-3 px-4 text-center font-bold text-slate-900 whitespace-nowrap">
                  Lead ในมือ
                </TableHead>
                <TableHead className="py-3 px-4 text-right font-bold text-slate-900">
                  จัดการ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                      กำลังโหลดข้อมูลสมาชิก...
                    </div>
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-slate-400"
                  >
                    ยังไม่มีสมาชิกในทีมนี้
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow
                    key={member.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className={cn(
                            "h-8 w-8 border shrink-0 shadow-xs",
                            member.isLeader ? "border-amber-200 ring-2 ring-amber-50" : "border-slate-100"
                          )}>
                            <AvatarImage src={member.avatar_url || ""} />
                            <AvatarFallback className={cn(
                              "text-[10px] font-bold",
                              member.isLeader ? "bg-amber-100 text-amber-700" : "bg-indigo-50 text-indigo-600"
                            )}>
                              {member.full_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {member.isLeader && (
                            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-[6px] text-white">⭐</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 whitespace-nowrap leading-tight">
                            {member.full_name || "ไม่มีชื่อ"}
                          </span>
                          {member.isLeader && (
                            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                              หัวหน้าทีม (Leader)
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <UserRoleBadge role={member.role} />
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                        <Briefcase className="h-3 w-3" />
                        {member.lead_count}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      {!member.isLeader && (
                        <button
                          onClick={() => setMemberToRemove(member)}
                          disabled={!!isRemoving}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                          title="ถอดออกจากทีม"
                        >
                          {isRemoving === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ResponsiveDialog
        open={!!memberToRemove}
        onOpenChange={(val: boolean) => !val && setMemberToRemove(null)}
        title="ยืนยันการถอดสมาชิก?"
        description="สมาชิกจะยังคงอยู่ในระบบแต่จะไม่สังกัดทีมใดๆ"
        footer={
          <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="ghost"
              onClick={() => setMemberToRemove(null)}
              className="flex-1 rounded-xl h-11 font-bold text-slate-500"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleRemoveMember}
              className="flex-1 rounded-xl h-11 px-8 font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-100 transition-all active:scale-95"
            >
              ยืนยันการถอดออก
            </Button>
          </div>
        }
      >
        <div className="p-6 text-center">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            คุณต้องการถอด <strong>{memberToRemove?.full_name}</strong>{" "}
            ออกจากทีม <strong>{teamName}</strong> ใช่หรือไม่?
          </p>
        </div>
      </ResponsiveDialog>
    </ResponsiveDialog>
  );
}
  

