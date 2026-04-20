"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  ChevronsUpDown,
  User,
  Search,
  Users,
  Sparkles,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createTeamAction,
  updateTeamAction,
  TeamWithManager,
} from "@/features/teams/actions/teamActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { m, AnimatePresence } from "framer-motion";

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamWithManager | null;
  potentialManagers: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  onSuccess: (team: TeamWithManager) => void;
}

export function TeamFormDialog({
  open,
  onOpenChange,
  team,
  potentialManagers,
  onSuccess,
}: TeamFormDialogProps) {
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (team) {
      setName(team.name);
      setManagerId(team.manager_id);
    } else {
      setName("");
      setManagerId(null);
    }
  }, [team, open]);

  const filteredManagers = useMemo(() => {
    return potentialManagers.filter((m) =>
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [potentialManagers, searchQuery]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      toast.error("กรุณาระบุชื่อทีม");
      return;
    }

    setIsLoading(true);
    try {
      if (team) {
        const result = await updateTeamAction(team.id, {
          name,
          manager_id: managerId,
        });

        if (result.success) {
          toast.success("อัปเดตข้อมูลทีมแล้ว");
          const managerObj = potentialManagers.find((m) => m.id === managerId);
          onSuccess({
            ...team,
            name,
            manager_id: managerId,
            manager: managerObj
              ? {
                  full_name: managerObj.full_name,
                  avatar_url: managerObj.avatar_url,
                }
              : null,
          });
          onOpenChange(false);
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาดในการอัปเดตทีม");
        }
      } else {
        const result = await createTeamAction(name, managerId || undefined);

        if (result.success) {
          toast.success("สร้างทีมสำเร็จ");
          const managerObj = potentialManagers.find((m) => m.id === managerId);
          onSuccess({
            ...result.data,
            manager: managerObj
              ? {
                  full_name: managerObj.full_name,
                  avatar_url: managerObj.avatar_url,
                }
              : null,
            agent_count: 0,
            member_previews: [],
          } as TeamWithManager);
          onOpenChange(false);
        } else {
          toast.error(result.message || "เกิดข้อผิดพลาดในการสร้างทีม");
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedManager = potentialManagers.find((m) => m.id === managerId);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={team ? "แก้ไขข้อมูลทีม (Edit Team)" : "สร้างทีมใหม่ (New Team)"}
      description="ระบุชื่อทีมและเลือกหัวหน้าทีมที่รับผิดชอบในสาขานี้"
      footer={
        <div className="flex w-full gap-3 p-1">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-2xl font-semibold text-slate-400 hover:bg-slate-100 italic"
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={() => handleSubmit()}
            className="flex-2 h-12 rounded-2xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
            disabled={isLoading}
          >
            {isLoading
              ? "กำลังประมวลผล..."
              : team
                ? "บันทึกการเปลี่ยนแปลง"
                : "สร้างทีมใหม่ทันที"}
          </Button>
        </div>
      }
    >
      <div className="space-y-8 py-6 px-6 text-left">
        {/* Team Name Input */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <Label
              htmlFor="name"
              className="text-slate-900 font-semibold text-xs uppercase tracking-widest"
            >
              ชื่อทีมพนักงาน
            </Label>
          </div>
          <div className="relative group">
            <Input
              id="name"
              placeholder="เช่น Team Silom Central, Sukhumvit Elite"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-3xl border-slate-200 h-16 bg-slate-50/50 shadow-inner focus:ring-4 focus:ring-indigo-500/5 placeholder:text-slate-300 font-semibold px-6 focus:bg-white transition-all"
              disabled={isLoading}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
              <ArrowRight className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Manager Selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <Label className="text-slate-900 font-semibold text-xs uppercase tracking-widest">
              หัวหน้าทีมผู้รับผิดชอบ
            </Label>
          </div>

          <ResponsiveDialog
            open={managerOpen}
            onOpenChange={setManagerOpen}
            title="เลือกหัวหน้าทีม (Select Manager)"
            description="ค้นหาและระบุตัวตนหัวหน้าพนักงานในระบบ"
            trigger={
              <button
                type="button"
                className={cn(
                  "w-full h-18 flex items-center justify-between px-6 rounded-[32px] border-2 border-slate-100 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:border-indigo-200 hover:bg-white text-left shadow-xs",
                  selectedManager && "border-amber-100 bg-amber-50/30",
                )}
                disabled={isLoading}
              >
                {selectedManager ? (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={selectedManager.avatar_url || ""} />
                        <AvatarFallback className="bg-amber-100 text-amber-600 font-semibold text-xs">
                          {selectedManager.full_name
                            ?.substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center">
                        <Sparkles className="h-2 w-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm leading-none mb-1">
                        {selectedManager.full_name}
                      </p>
                      <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-tighter">
                        Active Team Leader
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                    <span className="text-slate-400 font-semibold italic">
                      ค้นหาและเลือกหัวหน้าทีม...
                    </span>
                  </div>
                )}
                <ChevronsUpDown className="h-4 w-4 text-slate-300" />
              </button>
            }
          >
            <div className="flex flex-col h-full max-h-[60vh] italic">
              <div className="sticky top-0 z-30 p-4 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="พิมพ์ชื่อพนักงาน..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <button
                  onClick={() => {
                    setManagerId(null);
                    setManagerOpen(false);
                  }}
                  className="w-full p-4 rounded-2xl border border-dashed border-slate-200 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-slate-400">
                    --- ไม่ระบุหัวหน้าทีม ---
                  </span>
                </button>

                {filteredManagers.map((manager) => (
                  <button
                    key={manager.id}
                    onClick={() => {
                      setManagerId(manager.id);
                      setManagerOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                      managerId === manager.id
                        ? "bg-amber-50/50 border-amber-200"
                        : "border-transparent bg-white hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                        <AvatarImage src={manager.avatar_url || ""} />
                        <AvatarFallback className="bg-slate-200 text-slate-600 font-semibold">
                          {manager.full_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold text-slate-900 leading-none mb-1">
                          {manager.full_name}
                        </p>
                        <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest">
                          Employee Profile
                        </p>
                      </div>
                    </div>
                    {managerId === manager.id && (
                      <Check className="h-5 w-5 text-amber-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </ResponsiveDialog>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed uppercase tracking-tighter">
              ระบบแสดงพนักงานที่มีบทบาท ADMIN หรือ MANAGER <br />
              ในสโคปสาขาที่คุณกำลังบริหารจัดการเท่านั้น
            </p>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
