"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, Shield, Edit2, Trash2, MoreVertical, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamWithManager } from "@/features/teams/actions/teamActions";
import { formatDate, cn } from "@/lib/utils";
import { m, AnimatePresence } from "framer-motion";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

interface TeamManagementTableProps {
  teams: TeamWithManager[];
  onEdit: (team: TeamWithManager) => void;
  onDelete: (team: TeamWithManager) => void;
  onViewMembers: (team: TeamWithManager) => void;
  onCreate: () => void;
  fetchedWithError?: boolean;
}

export function TeamManagementTable({
  teams,
  onEdit,
  onDelete,
  onViewMembers,
  onCreate,
  fetchedWithError = false,
}: TeamManagementTableProps) {
  return (
    <div className="space-y-6">
      {/* 🖥️ Desktop View (Table) */}
      <div className="hidden xl:block bg-white/50 backdrop-blur-md rounded-[32px] border border-white/40 shadow-sm overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50/40 border-b border-white/20">
            <TableRow className="hover:bg-transparent border-b border-slate-100/50">
              <TableHead className="py-4 px-8 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">
                ชื่อทีม (Team Name)
              </TableHead>
              <TableHead className="py-4 px-8 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">
                หัวหน้าทีม (Leader)
              </TableHead>
              <TableHead className="py-4 px-8 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">
                สมาชิก (Members)
              </TableHead>
              <TableHead className="py-4 px-8 font-semibold text-slate-400 uppercase tracking-widest text-[10px]">
                วันที่สร้าง
              </TableHead>
              <TableHead className="py-4 px-8 text-right font-semibold text-slate-400 uppercase tracking-widest text-[10px]">
                จัดการ
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {teams.length === 0 ? (
                <EmptyState
                  onCreate={onCreate}
                  colSpan={5}
                  isError={fetchedWithError}
                />
              ) : (
                teams.map((team, idx) => (
                  <m.tr
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    key={team.id}
                    className="group border-b border-slate-50 hover:bg-white/60 transition-all duration-300"
                  >
                    <TableCell className="py-3 px-8">
                      <TeamNameDisplay name={team.name} />
                    </TableCell>
                    <TableCell className="px-8">
                      <ManagerDisplay manager={team.manager} />
                    </TableCell>
                    <TableCell className="px-8">
                      <MemberStack
                        previews={team.member_previews}
                        count={team.agent_count}
                      />
                    </TableCell>
                    <TableCell className="px-8">
                      <p className="text-sm font-semibold text-slate-400">
                        {formatDate(team.created_at || "")}
                      </p>
                    </TableCell>
                    <TableCell className="py-3 px-8 text-right">
                      <ActionMenu
                        teamName={team.name}
                        onEdit={() => onEdit(team)}
                        onDelete={() => onDelete(team)}
                        onViewMembers={() => onViewMembers(team)}
                      />
                    </TableCell>
                  </m.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* 📱 Mobile View (Cards) */}
      <div className="xl:hidden space-y-4 grid grid-cols-1 md:grid-cols-2 ">
        <AnimatePresence mode="popLayout">
          {teams.length === 0 ? (
            <div className="bg-white/50 backdrop-blur-md rounded-[32px] border border-white/40 p-12">
              <EmptyState onCreate={onCreate} isError={fetchedWithError} />
            </div>
          ) : (
            teams.map((team, idx) => (
              <m.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/60  backdrop-blur-md rounded-[32px] border border-white/40 p-6 shadow-sm space-y-6"
              >
                <div className="flex items-center justify-between">
                  <TeamNameDisplay name={team.name} />
                  <ActionMenu
                    teamName={team.name}
                    onEdit={() => onEdit(team)}
                    onDelete={() => onDelete(team)}
                    onViewMembers={() => onViewMembers(team)}
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-[24px] border border-slate-100/50">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    หัวหน้าทีม (Team Leader)
                  </p>
                  <ManagerDisplay manager={team.manager} />
                </div>

                <div className="flex flex-col items-center justify-center py-2 space-y-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    สมาชิกเข้าร่วม (Members Pool)
                  </p>
                  <MemberStack
                    previews={team.member_previews}
                    count={team.agent_count}
                    centralized
                  />
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest italic">
                    สร้างเมื่อ {formatDate(team.created_at || "")}
                  </span>
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                </div>
              </m.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TeamNameDisplay({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-indigo-50/50 flex items-center justify-center border border-indigo-100/30 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-500 shadow-xs">
        <Users className="h-4 w-4 text-indigo-600 group-hover:text-white transition-colors" />
      </div>
      <div>
        <p className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors leading-tight">
          {name}
        </p>
        <p className="text-[10px] md:text-[11px] font-semibold text-slate-400 tracking-wider uppercase italic">
          กลุ่มพนักงาน (Unit Squad)
        </p>
      </div>
    </div>
  );
}

function ManagerDisplay({ manager }: { manager: any }) {
  if (!manager)
    return (
      <div className="flex flex-col">
        <span className="text-slate-400 italic text-xs font-semibold">
          ยังไม่ได้ระบุหัวหน้าทีม
        </span>
        <span className="text-[10px] text-slate-300 font-semibold tracking-widest uppercase italic">
          (Leader Unassigned)
        </span>
      </div>
    );

  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="h-8 w-8 border-2 border-white shadow-xs ring-1 ring-slate-100">
        <AvatarImage src={manager.avatar_url || ""} />
        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-semibold text-[10px]">
          {manager.full_name?.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-semibold text-slate-700 text-sm">
          {manager.full_name}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold tracking-widest uppercase italic">
          <Shield className="h-3 w-3" />
          หัวหน้าทีม (Team Leader)
        </span>
      </div>
    </div>
  );
}

function MemberStack({
  previews = [],
  count = 0,
  centralized,
}: {
  previews?: any[];
  count?: number | null;
  centralized?: boolean;
}) {
  return (
    <div className={`flex items-center ${centralized ? "flex-col gap-4" : ""}`}>
      <TooltipProvider>
        <div className="flex -space-x-3 overflow-hidden">
          {previews?.map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-white shadow-xs transition-transform hover:-translate-y-1 hover:z-10 cursor-pointer">
                  <AvatarImage src={member.avatar_url || ""} />
                  <AvatarFallback className="bg-slate-100 text-slate-500 text-[9px] font-semibold">
                    {member.full_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white border-0 rounded-lg p-2">
                <p className="text-xs font-semibold">{member.full_name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {(count || 0) > 5 && (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 border-2 border-white text-[9px] font-semibold text-slate-500 shadow-xs italic">
              +{count! - 5}
            </div>
          )}
        </div>
      </TooltipProvider>
      <span
        className={cn(
          centralized ? "" : "ml-3",
          "text-[9px] font-semibold text-indigo-500 px-2.5 py-0.5 bg-indigo-50/50 rounded-full border border-indigo-100/30 uppercase tracking-widest italic shadow-xs leading-none",
        )}
      >
        {count || 0} เอเจนท์ (Agents)
      </span>
    </div>
  );
}

function ActionMenu({
  teamName,
  onEdit,
  onDelete,
  onViewMembers,
}: {
  teamName: string;
  onEdit: () => void;
  onDelete: () => void;
  onViewMembers: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={`จัดการทีม: ${teamName}`}
      description="เลือกดำเนินการกับรายการทีมที่คุณต้องการจัดการ"
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-100 shadow-xs"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      }
    >
      <div className="p-4 space-y-3">
        <button
          onClick={() => {
            onEdit();
            setOpen(false);
          }}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
        >
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-xs border border-white/50">
            <Edit2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">
              แก้ไขข้อมูลทีม (Edit Team)
            </p>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest mt-0.5">
              Change name or leader
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            onViewMembers();
            setOpen(false);
          }}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
        >
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-xs border border-white/50">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">
              สมาชิกในทีม (Team Members)
            </p>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest mt-0.5">
              Manage agents in this pool
            </p>
          </div>
        </button>

        <div className="h-px bg-slate-100 my-2 mx-4" />

        <button
          onClick={() => {
            onDelete();
            setOpen(false);
          }}
          className="w-full flex items-center gap-4 p-4 rounded-3xl bg-rose-50/50 hover:bg-rose-50 text-rose-600 transition-all text-left group"
        >
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-xs border border-white/50 group-hover:scale-110 transition-transform">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">ลบทีมพนักงาน (Delete Team)</p>
            <p className="text-[10px] uppercase font-semibold text-rose-400 tracking-widest mt-0.5 italic">
              Permanent Action
            </p>
          </div>
        </button>
      </div>
    </ResponsiveDialog>
  );
}

function EmptyState({
  onCreate,
  colSpan,
  isError,
}: {
  onCreate: () => void;
  colSpan?: number;
  isError?: boolean;
}) {
  const content = (
    <m.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center space-y-6 mx-auto"
    >
      <div
        className={cn(
          "h-24 w-24 rounded-[40px] flex items-center justify-center border",
          isError
            ? "bg-rose-50 border-rose-100"
            : "bg-indigo-50/50 border-indigo-100/50",
        )}
      >
        {isError ? (
          <Shield className="h-10 w-10 text-rose-300" />
        ) : (
          <Users className="h-10 w-10 text-indigo-300" />
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-slate-900 tracking-tight text-center">
          {isError
            ? "เกิดข้อผิดพลาดในการโหลดข้อมูล"
            : "รวมพลังด้วยการสร้างทีมแรก"}
        </h3>
        <p className="text-slate-500 text-sm max-w-sm sm:max-w-none mx-auto font-medium text-center">
          {isError
            ? "ระบบไม่สามารถดึงรายชื่อทีมจากฐานข้อมูลได้ในขณะนี้ กรุณารีเฟรชหน้าจอหรือติดต่อฝ่ายเทคนิค"
            : "การแบ่งทีมช่วยให้คุณจัดการลีดและมอบหมายงานให้พนักงานเฉพาะกลุ่มได้อย่างรวดเร็วและเป็นระเบียบ"}
        </p>
      </div>
      {!isError && (
        <Button
          onClick={onCreate}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-10 h-14 font-semibold shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-5 w-5 mr-3" />
          เริ่มสร้างทีมแรกของสาขานี้
        </Button>
      )}
      {isError && (
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-slate-200 text-slate-600 rounded-2xl px-10 h-14 font-semibold hover:bg-slate-50 transition-all"
        >
          ลองใหม่อีกครั้ง (Retry)
        </Button>
      )}
    </m.div>
  );

  if (colSpan) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="py-32 text-center">
          {content}
        </TableCell>
      </TableRow>
    );
  }

  return content;
}
