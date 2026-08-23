"use client";

import React, { useState } from "react";
import { ResponsiveDialog, DialogClose, DrawerClose } from "@/components/ui/responsive-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
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

import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const isEn = language === "en";

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
        toast.success(isEn ? "Invitation sent successfully" : "ส่งคำเชิญเรียบร้อยแล้ว");
        setOpen(false);
        setFormData({ email: "", role: "AGENT" });
        onSuccess?.();
      } else {
        toast.error(res.error || (isEn ? "Failed to send invitation" : "ไม่สามารถส่งคำเชิญได้"));
      }
    } catch (error) {
      toast.error(isEn ? "Error sending invitation" : "เกิดข้อผิดพลาดในการส่งคำเชิญ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isEn ? "Invite Team Member" : "เชิญสมาชิกใหม่"}
      description={
        isEn
          ? "Send an email invitation to an employee to join this branch."
          : "ส่งคำเชิญไปยังพนักงานผ่าน Email เพื่อให้เข้าร่วมสาขานี้"
      }
      trigger={
        <Button
          variant="outline"
          className="gap-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 font-semibold rounded-xl transition-all shadow-sm h-11 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          {isEn ? "Invite Member via Email" : "เชิญสมาชิกผ่าน Email"}
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-4 pb-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-semibold text-slate-700 ml-1"
            >
              {isEn ? "Member Email" : "Email พนักงาน"}
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="h-12 pl-11 rounded-xl border-slate-200 focus:ring-blue-500/10 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="role"
              className="text-sm font-semibold text-slate-700 ml-1"
            >
              {isEn ? "Role" : "ตำแหน่ง (Role)"}
            </Label>
            <Select
              value={formData.role}
              onValueChange={(val) => setFormData({ ...formData, role: val })}
            >
              <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-blue-500/10 cursor-pointer">
                <SelectValue placeholder={isEn ? "Select role" : "เลือกตำแหน่ง"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="ADMIN">
                  {isEn ? "Administrator (ADMIN)" : "ผู้ดูแลระบบ (ADMIN)"}
                </SelectItem>
                <SelectItem value="MANAGER">
                  {isEn ? "Branch Manager (MANAGER)" : "ผู้จัดการสาขา (MANAGER)"}
                </SelectItem>
                <SelectItem value="AGENT">
                  {isEn ? "Sales Agent (AGENT)" : "พนักงานขาย (AGENT)"}
                </SelectItem>
                <SelectItem value="VIEWER">
                  {isEn ? "Viewer (VIEWER)" : "ผู้เข้าชม (VIEWER)"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isMobile ? (
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
            </DrawerClose>
          ) : (
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                {isEn ? "Cancel" : "ยกเลิก"}
              </Button>
            </DialogClose>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || !formData.email}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEn ? "Sending..." : "กำลังส่ง..."}
              </>
            ) : (
              isEn ? "Send Invitation" : "ส่งคำเชิญ"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
