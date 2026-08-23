"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_STYLES,
  PROPERTY_STATUS_ORDER,
} from "@/features/properties/labels";
import type { PropertyStatus } from "@/features/properties/types";
import { bulkUpdateStatusAction } from "@/features/properties/bulk-actions";
import { startProcess, finishProcess } from "@/lib/process-monitor";

import { useLanguage } from "@/components/providers/LanguageProvider";

interface BulkPropertyStatusDropdownProps {
  selectedIds: string[];
  onSuccess: () => void;
}

export function BulkPropertyStatusDropdown({
  selectedIds,
  onSuccess,
}: BulkPropertyStatusDropdownProps) {
  const [isPending, startTransition] = useTransition();
  const { language } = useLanguage();
  const isEn = language === "en";

  const handleBulkUpdate = (status: PropertyStatus) => {
    const statusLabel = PROPERTY_STATUS_LABELS[status]?.[language] || PROPERTY_STATUS_LABELS[status]?.en || status;
    const processId = startProcess(
      isEn
        ? `Updating property status to ${statusLabel} (${selectedIds.length} listings)`
        : `ปรับสถานะทรัพย์เป็น ${statusLabel} (${selectedIds.length} รายการ)`,
      { type: "BULK_UPDATE" }
    );

    startTransition(async () => {
      try {
        const result = await bulkUpdateStatusAction(selectedIds, status);
        if (result.success) {
          finishProcess(processId, "SUCCESS", result.message);
          onSuccess();
        } else {
          finishProcess(processId, "ERROR", result.message || (isEn ? "Error occurred" : "เกิดข้อผิดพลาด"));
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : (isEn ? "Error updating status" : "เกิดข้อผิดพลาดในการอัปเดต");
        finishProcess(processId, "ERROR", msg);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="h-11 text-xs bg-white hover:bg-slate-50! border-slate-200! text-slate-700! font-bold shadow-sm cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
          )}
          {isEn ? "Bulk Change Status" : "เปลี่ยนสถานะกลุ่ม"}
          <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-100">
        <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">
          {isEn ? `Select New Status (${selectedIds.length} items)` : `เลือกสถานะใหม่ (${selectedIds.length} รายการ)`}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-slate-50" />
        
        {/* Active Group */}
        <div className="px-2 py-1.5 text-[10px] font-bold text-blue-600/60 uppercase">
          {isEn ? "Market States" : "สถานะการขาย"}
        </div>
        {["ACTIVE", "UNDER_OFFER", "RESERVED"].map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => handleBulkUpdate(s as PropertyStatus)}
            className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer focus:bg-blue-50 focus:text-blue-700"
          >
            <div className={cn("h-2 w-2 rounded-full", PROPERTY_STATUS_STYLES[s as PropertyStatus].dot)} />
            <span className="text-sm font-semibold">
              {PROPERTY_STATUS_LABELS[s as PropertyStatus]?.[language] || PROPERTY_STATUS_LABELS[s as PropertyStatus]?.en || s}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-1 bg-slate-50" />
        
        {/* Closed Group */}
        <div className="px-2 py-1.5 text-[10px] font-bold text-emerald-600/60 uppercase">
          {isEn ? "Final States" : "ปิดดีลแล้ว"}
        </div>
        {["SOLD", "RENTED"].map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => handleBulkUpdate(s as PropertyStatus)}
            className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-700"
          >
            <div className={cn("h-2 w-2 rounded-full", PROPERTY_STATUS_STYLES[s as PropertyStatus].dot)} />
            <span className="text-sm font-semibold">
              {PROPERTY_STATUS_LABELS[s as PropertyStatus]?.[language] || PROPERTY_STATUS_LABELS[s as PropertyStatus]?.en || s}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-1 bg-slate-50" />

        {/* Other Group */}
        <div className="px-2 py-1.5 text-[10px] font-bold text-slate-600/60 uppercase">
          {isEn ? "Management" : "จัดการอื่น ๆ"}
        </div>
        {["DRAFT", "ARCHIVED"].map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => handleBulkUpdate(s as PropertyStatus)}
            className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer focus:bg-slate-100 focus:text-slate-900"
          >
            <div className={cn("h-2 w-2 rounded-full", PROPERTY_STATUS_STYLES[s as PropertyStatus].dot)} />
            <span className="text-sm font-semibold">
              {PROPERTY_STATUS_LABELS[s as PropertyStatus]?.[language] || PROPERTY_STATUS_LABELS[s as PropertyStatus]?.en || s}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
