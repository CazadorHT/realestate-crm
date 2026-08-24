"use client";

import { 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage, 
  FormField 
} from "@/components/ui/form";
import { Info, Plus, MapPin, AlertCircle } from "lucide-react";
import { DealCombobox } from "@/features/deals/components/DealCombobox";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { ContractFormInput, type ContractDealSummary } from "@/features/rental-contracts/schema";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/language-context";

interface Step1Props {
  selectedDeal: ContractDealSummary | null;
  onDealSelect: (val: string, picked: ContractDealSummary | null) => void;
  alreadyHasContract: boolean;
}

export function Step1DealSelection({
  selectedDeal,
  onDealSelect,
  alreadyHasContract,
}: Step1Props) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const form = useFormContext<ContractFormInput>();

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      <FormField
        control={form.control}
        name="deal_id"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <div className="flex items-center justify-between ml-1 leading-none">
              <FormLabel className="text-sm font-bold text-slate-700">
                {isEn ? "Associated Deal" : "ดีลที่เกี่ยวข้อง"}
              </FormLabel>
              {alreadyHasContract && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg animate-in fade-in zoom-in duration-300">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{isEn ? "Deal already has a contract" : "ดีลนี้มีสัญญาอยู่แล้ว"}</span>
                </div>
              )}
            </div>
            <FormControl>
              <DealCombobox
                value={form.watch("deal_id") || ""}
                status="CLOSED_WIN"
                onChange={(val, picked) => onDealSelect(val || "", picked ?? null)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedDeal ? (
        <div className="flex flex-row gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100 shadow-inner">
            {selectedDeal.cover_image_url ? (
              <Image
                src={selectedDeal.cover_image_url}
                alt={selectedDeal.property_title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 128px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Plus className="w-8 h-8 opacity-40" />
              </div>
            )}
            <div
              className={cn(
                "absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm",
                selectedDeal.deal_type === "RENT"
                  ? "bg-blue-600 text-white"
                  : "bg-emerald-600 text-white",
              )}
            >
              {selectedDeal.deal_type === "RENT" ? (isEn ? "RENT" : "เช่า") : (isEn ? "SALE" : "ขาย")}
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 text-base sm:text-lg leading-tight line-clamp-2">
                {selectedDeal.property_title}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate">{selectedDeal.location || (isEn ? "Location unspecified" : "ไม่ระบุทำเล")}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{isEn ? "Client:" : "ลูกค้า:"}</span>
                <span className="text-blue-600 font-bold truncate">{selectedDeal.lead_name}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-slate-50">
              {selectedDeal.deal_type === "RENT" ? (
                <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 flex items-center gap-2">
                  <span className="text-[10px] font-bold opacity-60">{isEn ? "Rent:" : "ค่าเช่า:"}</span>
                  <span className="text-xs font-bold">฿{(selectedDeal.rental_price ?? selectedDeal.original_rental_price ?? 0).toLocaleString()}</span>
                </div>
              ) : (
                <div className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-2">
                  <span className="text-[10px] font-bold opacity-60">{isEn ? "Sale Price:" : "ราคาขาย:"}</span>
                  <span className="text-xs font-bold">฿{(selectedDeal.price ?? selectedDeal.original_price ?? 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200/50">
          <Info className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-sm font-bold">{isEn ? "Please select a deal to create a contract" : "กรุณาเลือกดีลที่ต้องการสร้างสัญญา"}</p>
        </div>
      )}
    </div>
  );
}

