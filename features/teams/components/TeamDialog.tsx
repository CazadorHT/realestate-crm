"use client";

import { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  createTeamAction,
  updateTeamAction,
  TeamWithManager,
} from "../actions/teamActions";
import { useLanguage } from "@/lib/i18n/language-context";

interface TeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamWithManager | null;
  potentialManagers: { id: string; full_name: string | null }[];
  onSuccess: (team: any) => void;
}

export function TeamDialog({
  isOpen,
  onClose,
  team,
  potentialManagers,
  onSuccess,
}: TeamDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState<string>("none");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setManagerId(team.manager_id || "none");
    } else {
      setName("");
      setManagerId("none");
    }
  }, [team, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!name.trim()) {
      toast.error(isEn ? "Please provide a team name" : "กรุณาระบุชื่อทีม");
      return;
    }

    setIsLoading(true);
    try {
      if (team) {
        // อัปเดตข้อมูลทีม
        const result = await updateTeamAction(team.id, {
          name,
          manager_id: managerId === "none" ? null : managerId,
        });

        if (result.success) {
          toast.success(isEn ? "Team updated successfully" : "อัปเดตข้อมูลทีมแล้ว");
          // สร้าง object จำลองเพื่ออัปเดต UI ทันที
          const managerObj =
            managerId === "none"
              ? null
              : potentialManagers.find((m) => m.id === managerId);
          onSuccess({
            ...team,
            name,
            manager_id: managerId === "none" ? null : managerId,
            manager: managerObj ? { full_name: managerObj.full_name } : null,
          });
          onClose();
        } else {
          toast.error(result.message || (isEn ? "Failed to update team" : "เกิดข้อผิดพลาดในการอัปเดตทีม"));
        }
      } else {
        // สร้างทีมใหม่
        const result = await createTeamAction(
          name,
          managerId === "none" ? undefined : managerId,
        );

        if (result.success) {
          toast.success(isEn ? "Team created successfully" : "สร้างทีมสำเร็จ");
          const managerObj =
            managerId === "none"
              ? null
              : potentialManagers.find((m) => m.id === managerId);
          onSuccess({
            ...result.data,
            manager: managerObj ? { full_name: managerObj.full_name } : null,
            agent_count: 0,
          });
          onClose();
        } else {
          toast.error(result.message || (isEn ? "Failed to create team" : "เกิดข้อผิดพลาดในการสร้างทีม"));
        }
      }
    } catch {
      toast.error(isEn ? "Failed to save team data" : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={(val) => !val && onClose()}
      title={
        team
          ? isEn ? "Edit Team Information" : "แก้ไขข้อมูลทีม"
          : isEn ? "Create New Team" : "สร้างทีมใหม่"
      }
      description={
        isEn
          ? "Specify team name and assign a team leader"
          : "ระบุชื่อทีมและเลือกหัวหน้าทีมที่ต้องการมอบหมาย"
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none rounded-xl h-11 font-bold border-slate-200 text-slate-500"
            disabled={isLoading}
          >
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-xl h-11 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
            disabled={isLoading}
          >
            {isLoading
              ? isEn ? "Saving..." : "กำลังบันทึก..."
              : isEn ? "Save Team" : "บันทึกข้อมูล"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 py-2 text-left">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-700 font-bold">
            {isEn ? "Team Name" : "ชื่อทีม"}
          </Label>
          <Input
            id="name"
            placeholder={isEn ? "e.g. Team Silom, Team Sukhumvit" : "เช่น Team Silom, Team Sukhumvit"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border-slate-200 h-11 focus:ring-indigo-500/10 placeholder:text-slate-300"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manager" className="text-slate-700 font-bold">
            {isEn ? "Team Leader (Manager)" : "หัวหน้าทีม (Manager)"}
          </Label>
          <Select
            value={managerId}
            onValueChange={setManagerId}
            disabled={isLoading}
          >
            <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-white">
              <SelectValue placeholder={isEn ? "Select team leader" : "เลือกหัวหน้าทีม"} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="none" className="py-3">
                {isEn ? "--- Unassigned ---" : "--- ไม่ระบุ ---"}
              </SelectItem>
              {potentialManagers.map((manager) => (
                <SelectItem key={manager.id} value={manager.id} className="py-3">
                  {manager.full_name || (isEn ? "No Name" : "ไม่มีชื่อ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            * เฉพาะผู้ที่มีบทบาท ADMIN หรือ MANAGER เท่านั้นที่เลือกได้
          </p>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
