"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
    e.preventDefault();
    if (!name.trim()) {
      toast.error("กรุณาระบุชื่อทีม");
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
          toast.success("อัปเดตข้อมูลทีมแล้ว");
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
          toast.error(result.message || "เกิดข้อผิดพลาดในการอัปเดตทีม");
        }
      } else {
        // สร้างทีมใหม่
        const result = await createTeamAction(
          name,
          managerId === "none" ? undefined : managerId,
        );

        if (result.success) {
          toast.success("สร้างทีมสำเร็จ");
          // Re-fetch ข้อมูลใหม่ผ่านการ refresh หรือส่งข้อมูลกลับ
          // ในกรณีนี้จะส่งผลลัพธ์จาก action กลับไป
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
          toast.error(result.message || "เกิดข้อผิดพลาดในการสร้างทีม");
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-100">
        <DialogHeader>
          <DialogTitle>{team ? "แก้ไขข้อมูลทีม" : "สร้างทีมใหม่"}</DialogTitle>
          <DialogDescription>
            ระบุชื่อทีมและเลือกหัวหน้าทีมที่ต้องการมอบหมาย
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อทีม</Label>
            <Input
              id="name"
              placeholder="เช่น Team Silom, Team Sukhumvit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border-slate-200 h-11"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager">หัวหน้าทีม (Manager)</Label>
            <Select
              value={managerId}
              onValueChange={setManagerId}
              disabled={isLoading}
            >
              <SelectTrigger className="rounded-xl border-slate-200 h-11">
                <SelectValue placeholder="เลือกหัวหน้าทีม" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="none">--- ไม่ระบุ ---</SelectItem>
                {potentialManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.full_name || "ไม่มีชื่อ"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-400">
              * เฉพาะผู้ที่มีบทบาท ADMIN หรือ MANAGER เท่านั้นที่เลือกได้
            </p>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11"
              disabled={isLoading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11 px-8"
              disabled={isLoading}
            >
              {isLoading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
