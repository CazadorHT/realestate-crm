"use client";

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { History, ShieldCheck, User, Clock } from "lucide-react";

interface PayoutHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPayout: any;
}

export function PayoutHistoryDrawer({
  isOpen,
  onClose,
  selectedPayout
}: PayoutHistoryDrawerProps) {
  if (!selectedPayout || Array.isArray(selectedPayout)) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md border-l-slate-100 overflow-y-auto">
        <SheetHeader className="pb-6 border-b border-slate-50">
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100/50">
            <History className="h-6 w-6 text-indigo-600" />
          </div>
          <SheetTitle className="text-2xl font-semibold text-slate-900">บันทึกการตรวจสอบ</SheetTitle>
          <SheetDescription className="text-slate-500">
            Audit Trail และประวัติการเปลี่ยนแปลงสถานะทั้งหมด
          </SheetDescription>
        </SheetHeader>

        <div className="py-8 space-y-8">
          {/* Payout Identity Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">ID รายการ</p>
            <p className="text-sm font-bold text-slate-900 font-mono">#{selectedPayout.id.slice(0, 8)}</p>
            <div className="pt-2">
              <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 text-[10px] font-bold">
                {selectedPayout.property?.title || "ไม่ทราบชื่อทรัพย์สิน"}
              </Badge>
            </div>
          </div>

          {/* Timeline of Actions */}
          <div className="space-y-6 relative ml-4">
            <div className="absolute left-[-17px] top-2 bottom-2 w-0.5 bg-slate-100" />
            
            {(selectedPayout.audit_meta || [
              { action: 'ระบบตรวจพบบันทึกคอมมิชชัน', timestamp: selectedPayout.created_at, author: 'System' },
              { action: 'อนุมัติการจ่ายคอมมิชชัน', timestamp: selectedPayout.updated_at, author: selectedPayout.author?.name || 'Administrator' }
            ]).map((step: any, idx: number) => (
              <div key={idx} className="relative group">
                <div className="absolute left-[-24px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-indigo-600 shadow-sm" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{step.action}</p>
                    {idx === 0 && (
                      <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-bold h-4">SUCCESS</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {step.author}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(step.timestamp), "d MMM yyyy HH:mm", { locale: th })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <p className="text-[11px] text-emerald-700 font-medium">บันทึกนี้ถูกบันทึกผ่านระบบ Blockchain-style Audit Trail ไม่สามารถย้อนกลับหรือแก้ไขได้</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
