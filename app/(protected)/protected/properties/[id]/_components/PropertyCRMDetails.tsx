"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PropertyStatusBadge } from "@/components/properties/PropertyStatusBadge";
import { DocumentList } from "@/features/documents/components/DocumentList";
import { useLanguage } from "@/components/providers/LanguageProvider";

import type { PropertyWithDetails, RelatedDealV3 as RelatedDeal } from "@/features/properties/types/v3";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PropertyCRMDetailsProps {
  property: PropertyWithDetails;
  relatedDeal: RelatedDeal | null;
  relatedContract: any | null;
  commissionLabel: string;
  tenantId: string | undefined;
}

export function PropertyCRMDetails({
  property,
  relatedDeal,
  relatedContract,
  commissionLabel,
  tenantId,
}: PropertyCRMDetailsProps) {
  const router = useRouter();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const { language } = useLanguage();
  const isEn = language === "en";
  
  if (!relatedDeal) return null;

  return (
    <m.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 rounded-3xl border border-white/60 p-6 sm:p-8 bg-white/40 backdrop-blur-xl shadow-xl shadow-slate-200/40 mt-8 sm:mt-12"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-extrabold flex flex-wrap items-center gap-2 text-slate-900 tracking-tight">
            <PropertyStatusBadge
              status={property.status || "DRAFT"}
              className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full shadow-sm"
              language={language}
            />
            {isEn ? "CRM Closed Deal" : "CRM ดีลสถานะสำเร็จ"}
          </h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Closed-Win Sales Intelligence</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto rounded-xl border-slate-200 bg-white hover:bg-slate-50 hover:text-blue-600 transition-all duration-300 font-bold shadow-sm cursor-pointer"
          onClick={() => {
            setNavigatingId(relatedDeal.id);
            router.push(`/protected/deals/${relatedDeal.id}`);
          }}
          disabled={navigatingId === relatedDeal.id}
        >
          {navigatingId === relatedDeal.id ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
          ) : null}
          {isEn ? "Deal Details (V3)" : "รายละเอียดดีล (V3)"}
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {[
          { label: isEn ? "Commission" : "ค่าคอมมิชชั่น", value: commissionLabel, color: "text-emerald-600", desc: "Total Commission" },
          { label: isEn ? "Lead / Client" : "ลูกค้า (Lead)", value: relatedDeal.lead?.full_name ?? "-", color: "text-slate-900", desc: "Buyer/Tenant Identity" },
          { label: isEn ? "Assigned Agent" : "ดูแลโดย", value: property.agent?.full_name ?? "-", color: "text-slate-900", desc: "In-charge Agent" },
        ].map((item, idx) => (
          <m.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="rounded-2xl border border-white bg-white/60 p-5 shadow-sm hover:shadow-md transition-shadow duration-300 group"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">
              {item.label}
            </div>
            <div className={cn("text-lg font-black tracking-tight", item.color)}>
              {item.value}
            </div>
            <div className="text-[9px] text-slate-300 font-medium mt-1 uppercase tracking-tighter">{item.desc}</div>
          </m.div>
        ))}
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 mt-8 pt-8 border-t border-slate-100">
        <div>
          <div className="text-xs sm:text-sm font-black text-slate-800 mb-5 flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-500" />
            </div>
            {isEn ? "Contract Document" : "เอกสารสัญญา (Contract)"}
          </div>
          {relatedContract?.id ? (
            <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-50 bg-white/40 p-4">
              <DocumentList
                ownerId={relatedContract.id}
                ownerType="RENTAL_CONTRACT"
                tenantId={tenantId}
              />
            </div>
          ) : (
            <m.div 
              whileHover={{ scale: 1.01 }}
              className="text-center py-10 sm:py-14 text-slate-400 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30 text-xs font-bold uppercase tracking-widest"
            >
              {isEn ? "No recorded contract yet" : "ยังไม่มีสัญญาที่บันทึก"}
            </m.div>
          )}
        </div>
        <div>
          <div className="text-xs sm:text-sm font-black text-slate-800 mb-5 flex items-center gap-3">
             <div className="w-1.5 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-indigo-500" />
            </div>
            {isEn ? "Deal Documents" : "เอกสารดีล (Documents)"}
          </div>
          <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-50 bg-white/40 p-4">
            <DocumentList
              ownerId={relatedDeal.id}
              ownerType="DEAL"
              tenantId={tenantId}
            />
          </div>
        </div>
      </div>
    </m.section>
  );
}

