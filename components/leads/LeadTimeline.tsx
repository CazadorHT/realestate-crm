"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { LeadActivityRow } from "@/features/leads/types";
import type { PropertySummary } from "@/features/leads/queries";
import {
  propertyTypeLabel,
  listingTypeLabel,
  getListingTypeFromDb,
} from "@/features/properties/labels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  Building2,
  Phone,
  MessageSquare,
  Mail,
  Eye,
  Repeat,
  FileText,
  Settings,
} from "lucide-react";
import {
  deleteLeadActivityAction,
  updateLeadActivityAction,
} from "@/features/leads/actions";
import { LeadActivityForm } from "@/components/leads/LeadActivityForm";
import type { LeadActivityFormValues } from "@/lib/types/leads";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { th } from "date-fns/locale";
import { format } from "date-fns";

const ACTIVITY_CONFIG: Record<
  string,
  { icon: any; color: string; label: string }
> = {
  CALL: {
    icon: Phone,
    color: "bg-emerald-50 text-emerald-600",
    label: "โทรศัพท์",
  },
  LINE_CHAT: {
    icon: MessageSquare,
    color: "bg-green-50 text-green-600",
    label: "LINE",
  },
  EMAIL: { icon: Mail, color: "bg-blue-50 text-blue-600", label: "อีเมล" },
  VIEWING: {
    icon: Eye,
    color: "bg-purple-50 text-purple-600",
    label: "พาชมทรัพย์",
  },
  FOLLOW_UP: {
    icon: Repeat,
    color: "bg-amber-50 text-amber-600",
    label: "ติดตามผล",
  },
  NOTE: {
    icon: FileText,
    color: "bg-slate-50 text-slate-600",
    label: "บันทึก",
  },
  SYSTEM: {
    icon: Settings,
    color: "bg-slate-100 text-slate-400",
    label: "ระบบ",
  },
};

function fmt(dt: string) {
  try {
    const d = new Date(dt);
    const date = d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  } catch {
    return { date: dt, time: "" };
  }
}

function fmtMoney(value: any, currency?: string | null) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const formatted = new Intl.NumberFormat("th-TH").format(n);
  return currency ? `${formatted} ${currency}` : formatted;
}

function PriceDisplay({ p }: { p: PropertySummary }) {
  const listingType = getListingTypeFromDb(p.listing_type as any);
  const isRent = listingType === "RENT";
  const isSale = listingType === "SALE";
  const isBoth = listingType === "SALE_AND_RENT";

  const renderPrice = (
    current: number | null | undefined,
    original: number | null | undefined,
    suffix: string = "",
  ) => {
    const effective = current ?? original;
    const hasDiscount =
      typeof original === "number" &&
      typeof effective === "number" &&
      original !== effective;

    return (
      <span className="inline-flex items-baseline gap-1">
        {hasDiscount && (
          <span className="line-through text-xs text-muted-foreground/70">
            {fmtMoney(original)}
          </span>
        )}
        <span className="font-medium text-green-600">
          {fmtMoney(effective, p.currency)}
          {suffix}
        </span>
      </span>
    );
  };

  if (isRent) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">เช่า:</span>
        {renderPrice(p.rental_price, p.original_rental_price, " /ด.")}
      </div>
    );
  }

  if (isSale) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">ขาย:</span>
        {renderPrice(p.price, p.original_price)}
      </div>
    );
  }

  if (isBoth) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">ขาย:</span>
          {renderPrice(p.price, p.original_price)}
        </div>
        <span className="text-muted-foreground/40">•</span>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">เช่า:</span>
          {renderPrice(p.rental_price, p.original_rental_price, " /ด.")}
        </div>
      </div>
    );
  }

  return null;
}

export function LeadTimeline({
  activities,
  propertiesById,
  leadId,
}: {
  activities: LeadActivityRow[];
  propertiesById: Record<string, PropertySummary>;
  leadId: string;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editActivity, setEditActivity] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteLeadActivityAction({ activityId: id, leadId });
      if (res.success) {
        toast.success("ลบกิจกรรมเรียบร้อย");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการลบกิจกรรม");
      }
      setDeleteId(null);
    });
  };

  const handleEdit = async (values: LeadActivityFormValues) => {
    if (!editActivity) return;
    const res = await updateLeadActivityAction({
      activityId: editActivity.id,
      leadId,
      values,
    });
    if (res.success) {
      toast.success("แก้ไขกิจกรรมเรียบร้อย");
      setEditActivity(null);
    } else {
      toast.error(res.error || "เกิดข้อผิดพลาดในการแก้ไขกิจกรรม");
    }
  };

  if (!activities?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">ยังไม่มีกิจกรรม</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {activities.map((a: any) => {
          const pid = a.property_id as string | null;
          const p = pid ? propertiesById[pid] : null;
          const config =
            ACTIVITY_CONFIG[a.activity_type] || ACTIVITY_CONFIG.NOTE;
          const Icon = config.icon;

          return (
            <Card
              key={a.id}
              className="group overflow-hidden border-none rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300"
            >
              <CardContent className="p-0 flex flex-row h-full min-h-[90px]">
                {/* 🖼️ Sidebar: Property Image or Category Icon */}
                <div
                  className={cn(
                    "relative w-20 md:w-24 shrink-0 overflow-hidden border-r border-slate-100 flex items-center justify-center transition-colors duration-300",
                    config.color,
                  )}
                >
                  {p?.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={p.title || ""}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <Icon className="h-6 w-6 opacity-80 group-hover:scale-110 transition-transform duration-500" />
                  )}
                </div>

                {/* 📝 Content Section */}
                <div className="relative flex-1 p-4 flex items-start justify-between gap-4 min-w-0">
                  {/* Timeline connecting line */}
                  <div className="absolute -left-px top-0 h-full w-[2px] bg-slate-100 hidden md:block" />
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border shadow-xs",
                          config.color,
                          "border-current/20",
                        )}
                      >
                        {config.label}
                      </span>
                      
                      {/* 👤 Created By Avatar */}
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={a.profiles?.avatar_url || ""} />
                          <AvatarFallback className="text-[6px] bg-blue-100 text-blue-600">
                            {a.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {a.profiles?.full_name?.split(' ')[0] || "System"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <Calendar className="h-3 w-3 opacity-50" />
                        {format(new Date(a.created_at), "d MMM yy • HH:mm", {
                          locale: th,
                        })}
                      </div>
                      {/* Action Menu */}
                      <div className="shrink-0 flex items-center ">
                        <ResponsiveDialog
                          title="จัดการกิจกรรม"
                          description="เลือกการดำเนินการสำหรับรายการนี้"
                          className="bg-white md:max-w-md"
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 active:scale-95 bg-white shadow-xs"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        >
                          <div className="p-4 space-y-3">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setEditActivity(a);
                              }}
                              className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100"
                            >
                              <div className="h-8 w-8 rounded-lg bg-blue-100/50 flex items-center justify-center">
                                <Pencil className="h-4 w-4" />
                              </div>
                              แก้ไขกิจกรรม
                            </Button>

                            <Button
                              variant="ghost"
                              onClick={() => {
                                setDeleteId(a.id);
                              }}
                              className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-100 group"
                            >
                              <div className="h-8 w-8 rounded-lg bg-rose-100/50 flex items-center justify-center group-hover:bg-rose-100">
                                <Trash2 className="h-4 w-4" />
                              </div>
                              ลบกิจกรรมนี้
                            </Button>
                          </div>
                        </ResponsiveDialog>
                      </div>
                    </div>

                    {a.note && (
                      <p className="font-semibold text-xs md:text-sm text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-2 pr-4 leading-relaxed">
                        {a.note}
                      </p>
                    )}

                    {/* 🏠 Property Card (Improved) */}
                    {p && (
                      <Link
                        href={`/protected/properties/${p.id}`}
                        className="flex items-center gap-3 rounded-xl border border-blue-50 bg-blue-50/20 p-2.5 hover:bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-900/5 transition-all mt-3 max-w-lg group/prop"
                      >
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight mb-0.5">
                            ทรัพย์สินที่เกี่ยวข้อง
                          </p>
                          <p className="text-xs font-bold text-slate-700 line-clamp-1 group-hover/prop:text-blue-600 transition-colors">
                            {p.title}
                          </p>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <ResponsiveDialog 
        open={!!editActivity} 
        onOpenChange={() => setEditActivity(null)} 
        title="แก้ไขกิจกรรม"
        className="bg-white md:max-w-lg"
      >
        <div className="p-4 md:p-6">
          {editActivity && (
            <LeadActivityForm
              onSubmitAction={handleEdit}
              defaultValues={{
                activity_type: editActivity.activity_type as any,
                note: editActivity.note ?? "",
                property_id: editActivity.property_id ?? null,
              }}
            />
          )}
        </div>
      </ResponsiveDialog>

      {/* Delete Confirmation Dialog */}
      <ResponsiveDialog 
        open={!!deleteId} 
        onOpenChange={() => setDeleteId(null)}
        title="ยืนยันการลบ"
        description="คุณต้องการลบกิจกรรมนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        className="bg-white md:max-w-md"
      >
        <div className="p-4 md:p-6 space-y-4">
          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3">
             <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setDeleteId(null)}
                className="w-full md:w-auto h-12 rounded-xl px-6 font-semibold text-slate-600 border-slate-200"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => deleteId && handleDelete(deleteId)}
                disabled={isPending}
                variant="destructive"
                className="w-full md:w-auto h-12 rounded-xl px-6 font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-100 border-none"
              >
                {isPending ? "กำลังลบ..." : "ยืนยันการลบ"}
              </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}
