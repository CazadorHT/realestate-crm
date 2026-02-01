"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { LeadActivityRow } from "@/features/leads/types";
import type { PropertySummary } from "@/features/leads/queries";
import {
  propertyTypeLabel,
  listingTypeLabel,
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
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  Building2,
} from "lucide-react";
import {
  deleteLeadActivityAction,
  updateLeadActivityAction,
} from "@/features/leads/actions";
import { LeadActivityForm } from "@/components/leads/LeadActivityForm";
import type { LeadActivityFormValues } from "@/lib/types/leads";
import { toast } from "sonner";

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
  const isRent = p.listing_type === "RENT";
  const isSale = p.listing_type === "SALE";
  const isBoth = p.listing_type === "SALE_AND_RENT";

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
  const [editActivity, setEditActivity] = useState<LeadActivityRow | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteLeadActivityAction(id, leadId);
      if (res.success) {
        toast.success("ลบกิจกรรมเรียบร้อย");
      } else {
        toast.error(res.message);
      }
      setDeleteId(null);
    });
  };

  const handleEdit = async (values: LeadActivityFormValues) => {
    if (!editActivity) return;
    const res = await updateLeadActivityAction(editActivity.id, leadId, values);
    if (res.success) {
      toast.success("แก้ไขกิจกรรมเรียบร้อย");
      setEditActivity(null);
    } else {
      toast.error(res.message);
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
      <div className="space-y-3">
        {activities.map((a: any) => {
          const pid = a.property_id as string | null;
          const p = pid ? propertiesById[pid] : null;
          const { date, time } = fmt(a.created_at);

          return (
            <div
              key={a.id}
              className="group relative rounded-lg border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
            >
              {/* Header - Date/Time + Actions */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{date}</span>
                  {time && (
                    <span className="text-muted-foreground/60">{time}</span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2"
                      onClick={() => setEditActivity(a)}
                    >
                      <Pencil className="h-4 w-4" />
                      แก้ไข
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-red-600 focus:text-red-600"
                      onClick={() => setDeleteId(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      ลบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Note */}
              {a.note && (
                <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                  {a.note}
                </p>
              )}

              {/* Property Card (Compact) */}
              {p && (
                <Link
                  href={`/protected/properties/${p.id}`}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white p-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-10 w-10 overflow-hidden rounded border bg-muted shrink-0">
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{p.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{propertyTypeLabel(p.property_type)}</span>
                      <span>•</span>
                      <span>{listingTypeLabel(p.listing_type)}</span>
                      <span>•</span>
                      <PriceDisplay p={p} />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editActivity} onOpenChange={() => setEditActivity(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>แก้ไขกิจกรรม</DialogTitle>
          </DialogHeader>
          <div className="py-2">
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
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบกิจกรรมนี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
