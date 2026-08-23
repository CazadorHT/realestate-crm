"use client";
import { useState } from "react";
import Image from "next/image";

import Link from "next/link";
import { format, differenceInHours, differenceInMonths } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { Sparkles, Eye, Edit2, Home, Calendar, Wallet, Copy, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DealWithProperty, DealPropertyOption } from "../types";
import { DealFormDialog } from "./DealFormDialog";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { DeleteDealButton } from "./DeleteDealButton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface DealsMobileCardProps {
  deal: DealWithProperty;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  properties: DealPropertyOption[];
  onRefresh: () => void;
  index?: number;
}

export function DealsMobileCard({
  deal,
  isSelected,
  onToggleSelect,
  properties,
  onRefresh,
  index,
}: DealsMobileCardProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";

  const [isNavigating, setIsNavigating] = useState(false);
  const refCode = (deal.property_id || "").slice(0, 8);

  const statusLabelMapTh: Record<string, string> = {
    NEGOTIATING: "กำลังต่อรอง",
    SIGNED: "เซ็นสัญญา",
    CLOSED_WIN: "จบดีลแล้ว",
    CLOSED_LOSS: "พลาดดีล",
    CANCELLED: "ยกเลิก",
  };

  const statusLabelMapEn: Record<string, string> = {
    NEGOTIATING: "Negotiating",
    SIGNED: "Signed",
    CLOSED_WIN: "Closed Won",
    CLOSED_LOSS: "Closed Lost",
    CANCELLED: "Cancelled",
  };

  const currentStatusMap = isEn ? statusLabelMapEn : statusLabelMapTh;

  return (
    <Card
      className={cn(
        "group overflow-hidden border border-slate-200 rounded-xl bg-white shadow-xs transition-all duration-300",
        isSelected ? "ring-2 ring-blue-500 shadow-lg bg-blue-50/10" : "hover:shadow-md hover:border-blue-200"
      )}
    >
      {isNavigating && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}
      <CardContent className="p-0 flex flex-col">
        {/* 📸 Image Section (Top) */}
        <div className="relative aspect-6/3 w-full overflow-hidden bg-slate-100">
          <div className="absolute top-3 left-3 z-20">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(deal.id)}
              className={cn(
                "h-6 w-6 rounded-lg border-white/40 bg-black/20 backdrop-blur-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm transition-all",
                isSelected && "bg-blue-600 border-blue-600"
              )}
            />
          </div>

          {(() => {
            const property = deal.property;
            const images = property?.images;
            const coverImage = images?.find((img) => img.is_cover)?.image_url || images?.[0]?.image_url;
            
            if (coverImage) {
              return (
                <Image
                  src={coverImage}
                  alt={deal.property?.title || "Property"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  fill
                  sizes="(max-width: 768px) 100vw, 384px"
                  unoptimized
                />
              );
            }

            return (
              <div className="h-full w-full flex items-center justify-center text-slate-200 bg-slate-50">
                <Home className="h-12 w-12" />
              </div>
            );
          })()}

          {/* Badges Overlays */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
            <div className="flex items-start justify-end">
              {index !== undefined && (
                <div className="h-8 w-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white text-xs font-semibold shadow-lg">
                  #{index}
                </div>
              )}
            </div>

            <div className="flex items-end justify-between">
              <Badge
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-xl shadow-lg border border-white/20 h-7",
                    deal.deal_type === "RENT" ? "bg-blue-600 text-white" : "bg-orange-500 text-white",
                  )}
                >
                  {deal.deal_type === "RENT" ? (isEn ? "Rent" : "เช่า") : (isEn ? "Sale" : "ขาย")}
                </Badge>
              <div className="pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-sm border border-blue-100 px-3 py-1.5 rounded-2xl shadow-xl flex items-center gap-2">
                   <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                   <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-tight leading-none">
                     {currentStatusMap[deal.status] || deal.status}
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📝 Content Section */}
        <div className="p-3 space-y-3">
          <div className="space-y-2">
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(refCode);
                toast.success(isEn ? `Copied code ${refCode}` : `คัดลอกรหัส ${refCode} แล้ว`, {
                  icon: <Copy className="h-4 w-4 text-blue-500" />,
                });
              }}
              className="text-[9px] font-semibold text-blue-600 uppercase tracking-widest leading-none bg-blue-50 p-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-1.5 group w-fit cursor-pointer"
            >
              REF: #{refCode}
              <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>

            <div
              onClick={() => {
                setIsNavigating(true);
                router.push(`/protected/deals/${deal.id}`);
              }}
              className="font-semibold text-sm line-clamp-2! wrap-break-word text-slate-800 leading-[1.3] hover:text-blue-600 transition-colors block cursor-pointer"
            >
              {deal.property?.title || (isEn ? "Untitled Property" : "ทรัพย์ไม่ระบุชื่อ")}
            </div>

            <div className="flex items-center gap-2">
              {(!deal.transaction_date || deal.undetermined_date) ? (
                <div className="flex items-center gap-2 py-1 px-2 bg-amber-50/50 rounded-xl border border-amber-200/50 text-[10px] font-medium text-amber-600 shadow-sm">
                  <Calendar className="h-3 w-3 text-amber-400" />
                  <span>{isEn ? "No date specified" : "ยังไม่ระบุวันที่"}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-50/50 rounded-2xl border border-slate-100 text-[10px] font-semibold text-slate-500 shadow-sm">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span className="text-slate-800">
                    {format(new Date(deal.transaction_date), "d MMM yy", { locale: isEn ? enUS : th })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Footer Commission & Actions */}
          <div className="flex items-center justify-between gap-2">
            {deal.commission_amount ? (
              <div className="flex items-center gap-2 p-1.5 pr-6 bg-emerald-500/5 rounded-[22px] border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                <div className="h-6 w-6 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                  <Wallet className="h-3 w-3" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-emerald-600/80 font-semibold uppercase tracking-tight">
                    {isEn ? "Commission" : "ค่าคอมมิชชั่น"}
                  </span>
                  <span className="text-sm font-semibold text-emerald-900 leading-none">
                    ฿{deal.commission_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-300 font-semibold italic text-sm">
                <Wallet className="h-4 w-4" />
                <span>NO COMMISSION</span>
              </div>
            )}

            <ResponsiveDialog
              title={isEn ? "Manage Deal" : "จัดการดีล"}
              description={isEn ? "Select an action for this deal" : "เลือกคำสั่งสำหรับดีลนี้"}
              className="bg-white md:max-w-72!"
              trigger={
                <Button
                  type="button"
                  size="icon"
                  className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all border border-slate-100 active:scale-95 flex items-center justify-center p-0 shadow-none border-none cursor-pointer"
                >
                  <MoreHorizontal className="h-6 w-6" />
                </Button>
              }
            >
              <div className="p-4 space-y-2">
                <div 
                  onClick={() => {
                    setIsNavigating(true);
                    router.push(`/protected/deals/${deal.id}`);
                  }} 
                  className="block w-full"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-14 rounded-2xl px-5 gap-4 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 cursor-pointer"
                    disabled={isNavigating}
                  >
                    <div className="h-10 w-10 rounded-xl bg-blue-100/50 flex items-center justify-center">
                      {isNavigating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </div>
                    {isEn ? "View Deal Details" : "ดูรายละเอียดดีล"}
                  </Button>
                </div>

                <DealFormDialog
                  leadId={deal.lead_id || ""}
                  deal={deal}
                  properties={properties}
                  refreshOnSuccess
                  trigger={
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-14 rounded-2xl px-5 gap-4 font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100 cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-xl bg-amber-100/50 flex items-center justify-center">
                        <Edit2 className="h-5 w-5" />
                      </div>
                      {isEn ? "Edit Deal Details" : "แก้ไขข้อมูลดีล"}
                    </Button>
                  }
                />

                <div className="h-px bg-slate-100 my-2" />

                <DeleteDealButton
                  dealId={deal.id}
                  leadId={deal.lead_id || ""}
                  propertyName={deal.property?.title}
                  customerName={deal.lead?.full_name}
                  onSuccess={() => {
                    router.refresh();
                    onRefresh?.();
                  }}
                  className="w-full"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-14 rounded-2xl px-5 gap-4 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all border border-transparent hover:border-rose-100 group cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-xl bg-rose-100/50 flex items-center justify-center group-hover:bg-rose-100">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    {isEn ? "Delete Deal" : "ลบดีลนี้"}
                  </Button>
                </DeleteDealButton>
              </div>
            </ResponsiveDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

