"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { UserPlus, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { createTenantInvitationAction } from "@/lib/actions/tenant-management";

interface InviteMemberDialogProps {
  tenantId: string;
  onSuccess?: () => void;
}

export function InviteMemberDialog({
  tenantId,
  onSuccess,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "AGENT",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return;

    setIsSubmitting(true);
    try {
      const res = await createTenantInvitationAction({
        tenantId,
        email: formData.email,
        role: formData.role as any,
      });

      if (res.success) {
        toast.success("ส่งคำเชิญเรียบร้อยแล้ว");
        setOpen(false);
        setFormData({ email: "", role: "AGENT" });
        onSuccess?.();
      } else {
        toast.error(res.error || "ไม่สามารถส่งคำเชิญได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการส่งคำเชิญ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 font-semibold rounded-xl transition-all shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          เชิญสมาชิกผ่าน Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              เชิญสมาชิกใหม่
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              ส่งคำเชิญไปยังพนักงานผ่าน Email เพื่อให้เข้าร่วมสาขานี้
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-slate-700"
              >
                Email พนักงาน
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-sm font-semibold text-slate-700"
              >
                ตำแหน่ง (Role)
              </Label>
              <Select
                value={formData.role}
                onValueChange={(val) => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger className="rounded-xl border-slate-200 focus:ring-blue-500">
                  <SelectValue placeholder="เลือกตำแหน่ง" />
                </SelectTrigger>
                <SelectContent className="rounded-xl z-200">
                  <SelectItem value="ADMIN">ผู้ดูแลระบบ (ADMIN)</SelectItem>
                  <SelectItem value="MANAGER">
                    ผู้จัดการสาขา (MANAGER)
                  </SelectItem>
                  <SelectItem value="AGENT">พนักงานขาย (AGENT)</SelectItem>
                  <SelectItem value="VIEWER">ผู้เข้าชม (VIEWER)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl font-semibold"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.email}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                "ส่งคำเชิญ"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
