"use client";

import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { 
  Handshake, 
  User, 
  Star, 
  ShieldCheck, 
  UserX, 
  ChevronRight, 
  Check 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkGroupChangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (targetGroup: string) => Promise<void>;
}

export function BulkGroupChangeDialog({
  isOpen,
  onOpenChange,
  selectedCount,
  onConfirm
}: BulkGroupChangeDialogProps) {
  const [targetGroup, setTargetGroup] = useState("GENERAL");
  const [isOperating, setIsOperating] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const groups = [
    { v: "GENERAL", label: "คู่ค้าทั่วไป", desc: "พาร์ทเนอร์ทั่วไปในระบบ", icon: User, color: "text-slate-500", bg: "bg-slate-50" },
    { v: "VIP", label: "คู่ค้า VIP", desc: "ลำดับความสำคัญสูงสุด (Priority)", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
    { v: "PARTNER", label: "พันธมิตรหลัก", desc: "คู่ค้าที่ได้รับการยืนยันระดับองค์กร", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50" },
    { v: "BLACKLIST", label: "บัญชีดำ", desc: "งดร่วมงาน/ระงับการเข้าถึงข้อมูล", icon: UserX, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  const selectedGroupData = groups.find(g => g.v === targetGroup) || groups[0];

  const handleConfirm = async () => {
    setIsOperating(true);
    await onConfirm(targetGroup);
    setIsOperating(false);
  };

  return (
    <ResponsiveDialog 
      open={isOpen} 
      className="max-w-md!"
      onOpenChange={onOpenChange}
      title="เปลี่ยนกลุ่มพาร์ทเนอร์"
      footer={
        <div className="flex gap-3 pt-6">
          <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-slate-500" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button 
            className="flex-[1.5] h-14 bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200 rounded-2xl font-bold text-white transition-all active:scale-95"
            onClick={handleConfirm}
            disabled={isOperating}
          >
            {isOperating ? "กำลังบันทึก..." : "ยืนยันการเปลี่ยนกลุ่ม"}
          </Button>
        </div>
      }
    >
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Handshake className="w-16 h-16" />
            </div>
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                <Handshake className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-900 leading-none mb-1">จัดการพาร์ทเนอร์แบบกลุ่ม</p>
                <p className="text-xs text-slate-500 font-medium">เปลี่ยนสถานะคู่ค้า <span className="font-bold text-blue-600 underline decoration-blue-200 decoration-2 underline-offset-4">{selectedCount} รายการ</span></p>
            </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">เลือกกลุ่มเป้าหมายใหม่</label>
          
          <ResponsiveDialog
            open={isSelectorOpen}
            onOpenChange={setIsSelectorOpen}
            title="เลือกเป้าหมายกลุ่มใหม่"
            className="max-w-sm!"
            description="พาร์ทเนอร์ที่เลือกจะถูกย้ายเข้าสู่กลุ่มนี้ทันที"
            trigger={
              <button className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-500 transition-all group">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", selectedGroupData.bg)}>
                    <selectedGroupData.icon className={cn("h-5 w-5", selectedGroupData.color)} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{selectedGroupData.label}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{selectedGroupData.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </button>
            }
          >
            <div className="p-6 space-y-3 ">
               {groups.map((group) => {
                 const isSelected = targetGroup === group.v;
                 return (
                   <button
                     key={group.v}
                     type="button"
                     onClick={() => {
                       setTargetGroup(group.v);
                       setIsSelectorOpen(false);
                     }}
                     className={cn(
                       "w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2",
                       isSelected 
                         ? "border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/5" 
                         : "border-slate-50 hover:border-slate-100 bg-white"
                     )}
                   >
                     <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", group.bg)}>
                          <group.icon className={cn("h-5 w-5", group.color)} />
                        </div>
                        <div className="text-left">
                           <p className={cn("text-sm font-bold", isSelected ? "text-blue-900" : "text-slate-700")}>{group.label}</p>
                           <p className="text-xs text-slate-400 font-medium">{group.desc}</p>
                        </div>
                     </div>
                     {isSelected && (
                       <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                         <Check className="h-3 w-3 text-white" />
                       </div>
                     )}
                   </button>
                 );
               })}
            </div>
          </ResponsiveDialog>
        </div>

        
      </div>
    </ResponsiveDialog>
  );
}
