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
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Search, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [branchSearch, setBranchSearch] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleTransfer = async () => {
    if (!targetTenantId) return;
    setIsTransferring(true);
    await onTransfer(targetTenantId);
    setIsTransferring(false);
    setTargetTenantId("");
  };

  const selectedBranch = branches.find(b => b.id === targetTenantId);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shadow-inner">
            <ArrowRightLeft className="text-indigo-600" />
          </div>
          <span>ย้ายสาขาพนักงาน</span>
        </div>
      }
      description="ดำเนินการย้ายสิทธิ์พนักงานไปยังส่วนงานอื่นในระบบ"
      footer={
        <div className="flex gap-3 w-full p-4 sm:p-0">
          <Button
            variant="ghost"
            className="rounded-xl h-12 text-slate-500 hover:bg-white flex-1"
            onClick={() => onOpenChange(false)}
          >
            ยกเลิก
          </Button>
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-slate-200 transition-all active:scale-95 flex-2"
            disabled={!targetTenantId || isTransferring}
            onClick={handleTransfer}
          >
            {isTransferring ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldAlert className="mr-2 h-4 w-4" />
            )}
            ยืนยันการย้ายถิ่นฐาน
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 p-6">
        <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2">
              พนักงาน
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage src={member?.avatarUrl || undefined} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">
                  {member?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-slate-900">{member?.name}</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              สาขาปัจจุบัน
            </p>
            <Badge
              variant="outline"
              className="bg-white border-indigo-100 text-indigo-700 font-bold shadow-none"
            >
              {currentBranchName}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3">
          <Label className="text-sm font-bold text-slate-900 px-1">
            เลือกสาขาปลายทาง
          </Label>
          <ResponsiveDialog
            open={isPickerOpen}
            onOpenChange={setIsPickerOpen}
            title="เลือกสาขาปลายทาง"
            trigger={
              <Button
                variant="outline"
                className="h-14 w-full rounded-2xl border-slate-200 focus:ring-indigo-600 transition-all shadow-sm justify-between px-4 bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <Building2 size={18} className="text-slate-400" />
                  {selectedBranch ? (
                    <span className="font-bold ">
                      {selectedBranch.name}
                    </span>
                  ) : (
                    <span className="font-normal">
                      ค้นหาสาขาปลายทาง...
                    </span>
                  )}
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </Button>
            }
          >
            <div className="flex flex-col h-full max-h-[60vh]">
              <div className="p-4 border-b border-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="ค้นหาชื่อหรือสลักสาขา..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="pl-9 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-1 gap-1">
                  {branches
                    .filter(
                      (b) =>
                        b.name
                          .toLowerCase()
                          .includes(branchSearch.toLowerCase()) ||
                        b.slug
                          .toLowerCase()
                          .includes(branchSearch.toLowerCase())
                    )
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setTargetTenantId(b.id);
                          setIsPickerOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group",
                          targetTenantId === b.id &&
                            "bg-indigo-50/50 ring-1 ring-indigo-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                            <Building2 size={18} className="text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 truncate">
                              {b.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {b.slug}
                            </p>
                          </div>
                        </div>
                        {targetTenantId === b.id && (
                          <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                        )}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </ResponsiveDialog>
        </div>

        <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
          <p className="text-[11px] text-rose-600 leading-relaxed font-semibold">
            ⚠️ <strong className="uppercase">คำเตือน:</strong>{" "}
            การย้ายสาขาจะตัดสิทธิ์การเข้าถึง Leads
            และข้อมูลภายในของสาขาเดิมทันที โปรดตรวจสอบให้แน่ใจก่อนกดยืนยัน
          </p>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
