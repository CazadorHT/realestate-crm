"use client";

import { Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] border-slate-100 sm:max-w-md overflow-hidden shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Trash2 size={32} className="text-rose-600 animate-bounce" />
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-2xl font-black text-slate-900">{title}</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 flex items-start gap-4">
            <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-700 leading-relaxed font-bold uppercase tracking-tight">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ พนักงานจะไม่สามารเข้าถึงข้อมูลสาขาได้อีกต่อไป โปรดตรวจสอบให้แน่ใจก่อนดำเนินการ
            </p>
          </div>
        </div>

        <DialogFooter className="bg-slate-50/50 -mx-6 -mb-6 p-6 px-10 gap-3">
          <Button 
            variant="ghost" 
            className="rounded-xl h-12 flex-1 text-slate-500 hover:bg-white" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-12 flex-1 px-8 font-black shadow-lg shadow-rose-200 transition-all active:scale-95"
            disabled={isLoading}
            onClick={onConfirm}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            ยืนยันการลบ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
