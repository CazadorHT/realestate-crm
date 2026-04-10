"use client";

import { useState } from "react";
import { ArrowRightLeft, Building2, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface TransferMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    profileId: string;
    name: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  branches: Array<{ id: string; name: string; slug: string }>;
  currentBranchName: string;
  onTransfer: (targetBranchId: string) => Promise<void>;
}

export function TransferMemberDialog({
  open,
  onOpenChange,
  member,
  branches,
  currentBranchName,
  onTransfer,
}: TransferMemberDialogProps) {
  const [targetTenantId, setTargetTenantId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleTransfer = async () => {
    if (!targetTenantId) return;
    setIsTransferring(true);
    await onTransfer(targetTenantId);
    setIsTransferring(false);
    setTargetTenantId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] border-slate-100 sm:max-w-md overflow-hidden shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900 italic">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner">
              <ArrowRightLeft className="text-indigo-600" />
            </div>
            ย้ายสาขาพนักงาน
          </DialogTitle>
          <DialogDescription className="text-slate-500 pt-2">
            ดำเนินการย้ายสิทธิ์พนักงานไปยังส่วนงานอื่นในระบบ
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-6">
          <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2">พนักงาน</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={member?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">{member?.name?.[0]}</AvatarFallback>
                </Avatar>
                <p className="font-bold text-slate-900">{member?.name}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">สาขาปัจจุบัน</p>
              <Badge variant="outline" className="bg-white border-indigo-100 text-indigo-700 font-bold shadow-none">{currentBranchName}</Badge>
            </div>
          </div>

          <div className="grid gap-3">
            <Label className="text-sm font-bold text-slate-900 px-1">เลือกสาขาปลายทาง</Label>
            <Select value={targetTenantId} onValueChange={setTargetTenantId}>
              <SelectTrigger className="h-14 rounded-2xl border-slate-200 focus:ring-indigo-600 transition-all shadow-sm">
                <SelectValue placeholder="ค้นหาสาขาปลายทาง..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl p-2 border-slate-100">
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id} className="rounded-xl py-3 focus:bg-indigo-50">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-slate-400 group-focus:text-indigo-600" />
                      <span className="font-semibold">{b.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({b.slug})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
            <p className="text-[11px] text-rose-600 leading-relaxed font-semibold">
              ⚠️ <strong className="uppercase">คำเตือน:</strong> การย้ายสาขาจะตัดสิทธิ์การเข้าถึง Leads และข้อมูลภายในของสาขาเดิมทันที โปรดตรวจสอบให้แน่ใจก่อนกดยืนยัน
            </p>
          </div>
        </div>

        <DialogFooter className="bg-slate-50/50 -mx-6 -mb-6 p-6 px-10">
          <Button variant="ghost" className="rounded-xl h-12 text-slate-500 hover:bg-white" onClick={() => onOpenChange(false)}>ยกเลิก</Button>
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
            disabled={!targetTenantId || isTransferring}
            onClick={handleTransfer}
          >
            {isTransferring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
            ยืนยันการย้ายถิ่นฐาน
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
