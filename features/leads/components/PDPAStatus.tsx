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
      const res = await updateLeadPDPAAction(leadId, !consent);
      if (res.success) {
        toast.success("อัปเดตสถานะ PDPA เรียบร้อย");
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              consent ? "bg-emerald-50" : "bg-amber-50",
            )}
          >
            {consent ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">สถานะความยินยอม (PDPA)</h3>
            <p className="text-xs text-slate-500">
              การจัดเก็บและใช้ข้อมูลส่วนบุคคล
            </p>
          </div>
        </div>
        <Button
          variant={consent ? "outline" : "default"}
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
          className={cn(!consent && "bg-emerald-600 hover:bg-emerald-500")}
        >
          {consent ? "ยกเลิกความยินยอม" : "กดยินยอม"}
        </Button>
      </div>

      <div className="flex items-center gap-4 text-sm mt-2">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="h-4 w-4" />
          <span>วันที่บันทึก:</span>
          <span className="font-medium">
            {consentDate
              ? new Date(consentDate).toLocaleString("th-TH")
              : "ไม่ระบุ"}
          </span>
        </div>
        <div
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            consent
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700",
          )}
        >
          {consent ? "CONSENTED" : "PENDING"}
        </div>
      </div>
    </div>
  );
}
