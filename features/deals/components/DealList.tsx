"use client";

import { DealWithProperty, DealPropertyOption } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInMonths } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import {
  Home,
  Eye,
  Edit2,
  Calendar,
  LayoutDashboard,
  ArrowRight,
  Wallet,
  MoreHorizontal,
  Trash2,
  Copy,
  Handshake,
} from "lucide-react";
import { DealFormDialog } from "./DealFormDialog";
import { DeleteDealButton } from "./DeleteDealButton";
import { DealStatusBadge } from "./DealStatusBadge";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FaClock } from "react-icons/fa6";
import { toast } from "sonner";

interface DealListProps {
  deals: DealWithProperty[];
  properties?: DealPropertyOption[];
  hasActiveFilters?: boolean;
}

export function DealList({ deals, properties = [], hasActiveFilters = false }: DealListProps) {
  const router = useRouter();

  if (deals.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-4xl border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-white p-12 my-4 animate-in zoom-in-95 duration-500">
        <div className="relative flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
            <div className="relative p-6 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-amber-500/30">
              <Handshake className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-semibold text-slate-800">
              {hasActiveFilters
                ? "ไม่พบดีลที่ค้นหา"
                : "ยังไม่มีดีลในระบบ"}
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              {hasActiveFilters
                ? "ลองปรับตัวกรองใหม่หรือค้นหาด้วยคำอื่น"
                : "เริ่มต้นสร้างดีลแรกของคุณเพื่อติดตามการขายและการเช่าทรัพย์"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 📜 Scrollable Container: Pure vertical scroll instead of pagination */}
      <div
        className="max-h-[520px] overflow-y-auto pr-3 sm:pr-4 -mr-3 sm:-mr-4  scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300 transition-colors"
        style={{ scrollbarWidth: "thin" }} // 🛡️ Native thin scrollbar fallback
      >
        <div className="grid grid-cols-1 gap-4 pb-4">
          {deals.map((deal, index) => (
            <Card
              key={deal.id}
              className="group overflow-hidden border-none rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300"
            >
              <CardContent className="p-0 flex flex-col md:flex-row h-full">
                {/* Image Section: Compact Sidebar */}
                <div className="relative w-full aspect-video md:w-32 lg:w-40 md:aspect-auto shrink-0 overflow-hidden bg-slate-50 border-r border-slate-100/50">
                  {(() => {
                    const property = deal.property;
                    const images = property?.images;
                    const hasImage = images?.[0]?.image_url;

                    if (hasImage && images) {
                      const coverImage =
                        images.find((img) => img.is_cover)?.image_url ||
                        images[0].image_url;
                      return (
                        <img
                          src={coverImage}
                          alt={deal.property?.title || "Property"}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      );
                    }

                    return (
                      <div className="h-full w-full flex items-center justify-center text-slate-200">
                        <Home className="h-8 w-8" />
                      </div>
                    );
                  })()}

                  {/* Index & Type Overlay (Mini) */}
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <div className="h-6 px-2 rounded-lg bg-black/40 backdrop-blur-sm border border-white/20 text-[9px] font-semibold text-white flex items-center justify-center">
                      #{index + 1}
                    </div>
                  </div>

                  <div className="absolute top-2 left-2 z-10">
                    <Badge
                      className={cn(
                        "text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-lg border border-white/20",
                        deal.deal_type === "RENT"
                          ? "bg-blue-600 text-white"
                          : "bg-orange-500 text-white",
                      )}
                    >
                      {deal.deal_type === "RENT" ? "เช่า" : "ขาย"}
                    </Badge>
                  </div>

                  {/* Status Badge Overlay */}
                  <div className="absolute bottom-2 left-2 z-10 scale-90 origin-bottom-left">
                    <DealStatusBadge status={deal.status} />
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Content Section (Compact) */}
                <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    {/* Header: Reference */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const refCode = (deal.property_id || "").slice(0, 8);
                          navigator.clipboard.writeText(refCode);
                          toast.success(`คัดลอกรหัส ${refCode} แล้ว`, {
                            description: "คุณสามารถนำไปวางในช่องค้นหาได้ทันที",
                            icon: <Copy className="h-4 w-4 text-blue-500" />,
                          });
                        }}
                        className="text-[9px] font-semibold text-blue-500 uppercase tracking-widest leading-none bg-blue-50 px-1.5 py-1 rounded-md border border-blue-100/50 hover:bg-blue-100 hover:border-blue-200 transition-all active:scale-95 flex items-center gap-1 group"
                        title="คลิกเพื่อคัดลอกรหัสอ้างอิง"
                      >
                        REF: #{(deal.property_id || "").slice(0, 8)}
                        <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>

                    {/* Title: Compact font */}
                    <Link
                      href={`/protected/properties/${deal.property_id || ""}`}
                      className="font-semibold text-sm lg:text-base text-slate-800 hover:text-blue-600 transition-colors block  leading-normal"
                      title={deal.property?.title || "Property"}
                    >
                      <span className="line-clamp-2">{deal.property?.title || "ทรัพย์ไม่ระบุชื่อ"}</span>
                    </Link>

                    {/* Metadata: Dates & Duration */}
                    <div className="flex flex-wrap items-center gap-2">
                      {(!deal.transaction_date || deal.undetermined_date) && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50/50 rounded-lg border border-amber-100 text-[10px] font-semibold text-amber-600">
                          <Calendar className="h-3 w-3 text-amber-400" />
                          <span>ยังไม่ระบุวันที่</span>
                        </div>
                      )}

                      {deal.transaction_date && !deal.undetermined_date && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50/50 rounded-lg border border-slate-100 text-[10px] font-semibold text-slate-500">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-800">
                            {format(
                              new Date(deal.transaction_date),
                              "d MMM yy",
                              {
                                locale: th,
                              },
                            )}
                          </span>
                        </div>
                      )}

                      {deal.deal_type === "RENT" &&
                        deal.transaction_end_date && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50/50 rounded-lg border border-slate-100 text-[10px] font-semibold text-slate-500">
                            <ArrowRight className="h-3 w-3 text-slate-300" />
                            <span className="text-slate-800">
                              {format(
                                new Date(deal.transaction_end_date),
                                "d MMM yy",
                                { locale: th },
                              )}
                            </span>
                          </div>
                        )}

                      {(() => {
                        // Priority 1: Use stored duration_months
                        // Priority 2: Calculate from transaction_date and transaction_end_date
                        let duration = deal.duration_months;

                        if (
                          !duration &&
                          deal.transaction_date &&
                          deal.transaction_end_date
                        ) {
                          duration = differenceInMonths(
                            new Date(deal.transaction_end_date),
                            new Date(deal.transaction_date),
                          );
                        }

                        if (duration && duration > 0) {
                          return (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50/30 rounded-lg border border-blue-100/50 text-[10px] font-semibold text-blue-600">
                              <FaClock className="h-3 w-3" />
                              <span>
                                {duration >= 12 && duration % 12 === 0
                                  ? `${Math.floor(duration / 12)} ปี`
                                  : `${duration} เดือน`}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Footer: Commission & Menu */}
                  <div className="pt-2.5 border-t border-slate-50 flex items-center justify-between gap-4">
                    {/* Commission Badge */}
                    {deal.commission_amount && deal.commission_amount > 0 ? (
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50/50 rounded-xl border border-emerald-100/20">
                        <div className="h-5 w-5 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                          <Wallet className="h-3 w-3" />
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-xs text-emerald-600/70 uppercase font-medium mb-0.5 tracking-relaxed">
                            ค่าคอมมิชชั่น
                          </span>
                          <span className="text-sm font-semibold text-emerald-900">
                            ฿{deal.commission_amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-300 px-2 py-1">
                        <Wallet className="h-3 w-3" />
                        <span className="text-[9px] font-semibold uppercase tracking-tighter">
                          no commission
                        </span>
                      </div>
                    )}

                    {/* Actions Trigger */}
                    <ResponsiveDialog
                      title="จัดการดีล"
                      description="เลือกคำสั่งสำหรับดีลนี้"
                      className="bg-white md:max-w-72!"
                      shouldScaleBackground={false}
                      onOpenAutoFocus={(e) => e.preventDefault()}
                      onCloseAutoFocus={(e) => e.preventDefault()}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100 active:scale-95 bg-white shadow-sm"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <div className="p-4 space-y-2">
                        <Link
                          href={`/protected/deals/${deal.id}`}
                          className="block w-full"
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                          >
                            <div className="h-8 w-8 rounded-lg bg-blue-100/50 flex items-center justify-center">
                              <Eye className="h-4 w-4" />
                            </div>
                            ดูรายละเอียดดีล
                          </Button>
                        </Link>

                        <DealFormDialog
                          leadId={deal.lead_id || ""}
                          deal={deal}
                          properties={properties}
                          refreshOnSuccess
                          trigger={
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-all border border-transparent hover:border-amber-100"
                            >
                              <div className="h-8 w-8 rounded-lg bg-amber-100/50 flex items-center justify-center">
                                <Edit2 className="h-4 w-4" />
                              </div>
                              แก้ไขข้อมูลดีล
                            </Button>
                          }
                        />

                        <div className="h-px bg-slate-100 my-2" />

                        <DeleteDealButton
                          dealId={deal.id}
                          leadId={deal.lead_id || ""}
                          propertyName={deal.property?.title}
                          customerName={deal.lead?.full_name}
                          onSuccess={() => router.refresh()}
                          className="w-full"
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all border border-transparent hover:border-rose-100 group"
                          >
                            <div className="h-8 w-8 rounded-lg bg-rose-100/50 flex items-center justify-center group-hover:bg-rose-100">
                              <Trash2 className="h-4 w-4" />
                            </div>
                            ลบดีลนี้
                          </Button>
                        </DeleteDealButton>
                      </div>
                    </ResponsiveDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
