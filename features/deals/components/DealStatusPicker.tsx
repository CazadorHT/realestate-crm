"use client";

import { useState } from "react";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DealStatus } from "../types";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface DealStatusPickerProps {
  value: DealStatus;
  onChange: (value: DealStatus) => void;
  disabled?: boolean;
}

export function DealStatusPicker({ value, onChange, disabled }: DealStatusPickerProps) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isEn = language === "en";

  const DEAL_STATUS_CONFIG: Record<
    DealStatus,
    { label: string; description: string; dot: string; text: string; bg: string; border: string }
  > = {
    NEGOTIATING: {
      label: isEn ? "Negotiating" : "เจรจาต่อรอง",
      description: isEn ? "In discussion and proposing terms" : "กำลังพูดคุยและเสนอเงื่อนไข",
      dot: "bg-slate-400",
      text: "text-slate-600",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
    SIGNED: {
      label: isEn ? "Contract Signed (Pending)" : "ทำสัญญาแล้ว (รอดำเนินการ)",
      description: isEn ? "Contract signed, awaiting transfer or delivery" : "เซ็นสัญญาแล้ว รอโอนหรือส่งมอบ",
      dot: "bg-blue-500",
      text: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    CLOSED_WIN: {
      label: isEn ? "Transferred / Commission Earned" : "โอน/ส่งมอบ/ได้รับคอม",
      description: isEn ? "Successfully closed and commission collected" : "ปิดการขายสำเร็จและได้รับค่าคอมมิชชั่น",
      dot: "bg-emerald-500",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    CLOSED_LOSS: {
      label: isEn ? "Closed Lost" : "ปิดการขายล้มเหลว",
      description: isEn ? "Lead dropped out or chose another property" : "ลีดไม่สนใจหรือเลือกทรัพย์อื่น",
      dot: "bg-rose-500",
      text: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
    },
    CANCELLED: {
      label: isEn ? "Deal Cancelled" : "ยกเลิกดีล",
      description: isEn ? "Negotiation terminated or deal voided" : "ยกเลิกการเจรจาหรือดีลโมฆะ",
      dot: "bg-slate-400",
      text: "text-slate-500",
      bg: "bg-slate-50",
      border: "border-slate-100",
    },
  };

  const current = DEAL_STATUS_CONFIG[value] || DEAL_STATUS_CONFIG.NEGOTIATING;

  const handleSelect = (status: DealStatus) => {
    onChange(status);
    setOpen(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isEn ? "Deal Status" : "สถานะดีล"}
      description={isEn ? "Select current stage to track pipeline progress" : "เลือกสถานะปัจจุบันเพื่อติดตามความคืบหน้าของดีล"}
      className="sm:max-w-sm!"
      trigger={
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-11 justify-between px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all group cursor-pointer",
            current.bg,
            current.border
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 animate-pulse", current.dot)} />
            <span className={cn("font-bold truncate", current.text)}>{current.label}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      }
    >
      <div className="flex flex-col gap-2 p-2">
        {(Object.entries(DEAL_STATUS_CONFIG) as [DealStatus, (typeof DEAL_STATUS_CONFIG)[DealStatus]][]).map(
          ([status, config]) => {
            const isSelected = value === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleSelect(status)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] border text-left cursor-pointer",
                  isSelected
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "border-transparent bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("h-3 w-3 rounded-full shrink-0", config.dot)} />
                  <div className="flex flex-col gap-0.5">
                    <span className={cn("text-sm font-bold", isSelected ? "text-blue-700" : "text-slate-900")}>
                      {config.label}
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium">{config.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          }
        )}
      </div>
    </ResponsiveDialog>
  );
}

