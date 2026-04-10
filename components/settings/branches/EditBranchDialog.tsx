"use client";

import { useState } from "react";
import { Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: { name: string; slug: string } | null;
  onUpdate: (data: { name: string; slug: string }) => Promise<void>;
}

export function EditBranchDialog({ open, onOpenChange, branch, onUpdate }: EditBranchDialogProps) {
  const [formData, setFormData] = useState({ name: branch?.name || "", slug: branch?.slug || "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await onUpdate(formData);
    setIsUpdating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] border-slate-100 sm:max-w-[425px] overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900 font-outfit">ตั้งค่าสาขา</DialogTitle>
            <DialogDescription className="text-slate-500">
              อัปเดตข้อมูลพื้นฐานของสาขาให้เป็นปัจจุบัน
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-8">
            <div className="grid gap-3">
              <Label htmlFor="branch-name" className="text-sm font-semibold text-slate-700 px-1">ชื่อสาขา</Label>
              <Input
                id="branch-name"
                className="h-12 rounded-xl border-slate-200 focus:ring-slate-900"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="branch-slug" className="text-sm font-semibold text-slate-700 px-1">Slug Identifier</Label>
              <Input
                id="branch-slug"
                className="h-12 rounded-xl border-slate-200 focus:ring-slate-900 font-mono text-sm"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                required
              />
              <p className="text-[10px] text-amber-600 font-medium px-1 uppercase tracking-wider">
                ⚠️ การแก้ Slug อาจส่งผลต่อ URL และการเข้าถึงระบบ
              </p>
            </div>
          </div>
          <DialogFooter className="bg-slate-50/50 -mx-6 -mb-6 p-6 px-10">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl h-12 text-slate-500 hover:bg-white"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdating}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8 shadow-lg shadow-slate-200"
            >
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Settings2 className="mr-2 h-4 w-4" />
              )}
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
