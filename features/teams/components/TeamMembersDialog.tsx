"use client";

import { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserRoleBadge } from "@/features/users/UserRoleBadge";
import { createClient } from "@/lib/supabase/client";
import { Users, Briefcase, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateUserTeamAction } from "@/features/users/actions/updateUserTeamAction";
import { cn } from "@/lib/utils";

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

  const fetchMembers = async () => {
    setIsLoading(true);
    const supabase = createClient();

    // ดึงข้อมูลสมาชิกพร้อมนับจำนวน Lead ที่ได้รับมอบหมาย
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        role,
        leads:leads(count)
      `,
      )
      .eq("team_id", teamId)
      .order("full_name");

    if (error) {
      console.error("Error fetching team members:", error);
      toast.error("ไม่สามารถโหลดข้อมูลสมาชิกทีมได้");
    } else {
      const formatted = data.map((m) => ({
        ...m,
        lead_count: m.leads?.[0]?.count || 0,
      }));
      setMembers(formatted);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && teamId) {
      fetchMembers();
    }
  }, [isOpen, teamId]);

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
                        <Avatar className="h-8 w-8 border border-slate-100 shrink-0">
                          <AvatarFallback className="bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                            {member.full_name
                              ?.split(" ")
                              .map((n: any) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-slate-700 whitespace-nowrap">
                          {member.full_name || "ไม่มีชื่อ"}
                        </span>
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
  

