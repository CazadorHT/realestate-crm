"use client";
import * as React from "react";
import { ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { updateLeadPDPAAction } from "../actions";
import { toast } from "sonner";

interface PDPAStatusProps {
  leadId: string;
  consent: boolean;
  consentDate: string | null;
}

export function PDPAStatus({ leadId, consent, consentDate }: PDPAStatusProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    try {
      const res = await updateLeadPDPAAction({ id: leadId, consent: !consent });
      if (res.success) {
        toast.success("อัปเดตสถานะ PDPA เรียบร้อย");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300">
      <div className="p-5 flex flex-col sm:flex-col sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300",
              consent 
                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50" 
                : "bg-slate-50 text-slate-400 ring-1 ring-slate-100"
            )}
          >
            {consent ? (
              <ShieldCheck className="h-6 w-6 group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <ShieldAlert className="h-6 w-6 group-hover:scale-110 transition-transform duration-500" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 tracking-tight">สถานะความยินยอม (PDPA)</h3>
              <div
                className={cn(
                  "px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-widest border",
                  consent
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-amber-50 text-amber-700 border-amber-100",
                )}
              >
                {consent ? "CONSENTED" : "PENDING"}
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              นโยบายการจัดเก็บและใช้ข้อมูลส่วนบุคคลตามกฎหมาย
            </p>
          </div>
        </div>

        <Button
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            "h-11 rounded-xl px-6 font-semibold transition-all active:scale-[0.98]",
            consent 
              ? "bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100" 
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 border-none"
          )}
        >
          {isPending ? "กำลังบันทึก..." : consent ? "ยกเลิกความยินยอม" : "กดยอมรับนโยบาย"}
        </Button>
      </div>

      <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <Clock className="h-3.5 w-3.5 opacity-60" />
          <span>วันที่บันทึก:</span>
          <span className={cn(
            "font-semibold",
            consent ? "text-slate-600" : "text-slate-400"
          )}>
            {consentDate
              ? new Date(consentDate).toLocaleString("th-TH", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "ไม่ระบุข้อมูล"}
          </span>
        </div>
        
        {consent && (
           <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <ShieldCheck className="h-3 w-3" />
              <span>ข้อมูลได้รับการคุ้มครอง</span>
           </div>
        )}
      </div>
    </div>
  );
}
