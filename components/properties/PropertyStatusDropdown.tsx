"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_ORDER,
  PROPERTY_STATUS_STYLES,
} from "@/features/properties/labels";

import type { PropertyStatus } from "@/features/properties/types";
import { updatePropertyStatusAction } from "@/features/properties/actions";
import { useRouter } from "next/navigation";
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

function statusTone(status: PropertyStatus) {
  const style = PROPERTY_STATUS_STYLES[status] || PROPERTY_STATUS_STYLES.DRAFT;
  return cn(style.bg, style.border, style.hover);
}

export function PropertyStatusSelect(props: {
  id: string;
  value: PropertyStatus;
  className?: string;
}) {
  const [value, setValue] = useState<PropertyStatus>(props.value);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const label = useMemo(() => PROPERTY_STATUS_LABELS[value], [value]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PropertyStatus | null>(
    null,
  );

  const commitChange = (nextStatus: PropertyStatus) => {
    if (nextStatus === value) return;

    const prev = value;
    setValue(nextStatus); // optimistic

    startTransition(async () => {
      const res = await updatePropertyStatusAction({
        id: props.id,
        status: nextStatus,
      });

      if (!res.success) {
        setValue(prev); // revert
        toast.error(res.message || "อัปเดตสถานะไม่สำเร็จ");
        return;
      }

      toast.success("อัปเดตสถานะเรียบร้อย");
      router.refresh();
    });
  };

  const onSelectStatus = (next: string) => {
    const nextStatus = next as PropertyStatus;

    // ✅ ต้อง confirm เฉพาะตอนเปลี่ยนเป็น ACTIVE (จากค่าอื่น)
    if (nextStatus === "ACTIVE" && value !== "ACTIVE") {
      setPendingStatus(nextStatus);
      setConfirmOpen(true);
      return;
    }

    commitChange(nextStatus);
  };

  const currentStyle =
    PROPERTY_STATUS_STYLES[value] || PROPERTY_STATUS_STYLES.DRAFT;

  const StatusItem = ({
    s,
    onClick,
  }: {
    s: PropertyStatus;
    onClick: () => void;
  }) => (
    <button
      key={s}
      onClick={onClick}
      disabled={isPending}
      className={cn(
        "w-full flex items-center justify-between p-3.5 rounded-xl transition-all active:scale-[0.98] border border-transparent",
        value === s
          ? "bg-blue-50 border-blue-100 shadow-sm"
          : "hover:bg-slate-200 hover:border-slate-100",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "h-3 w-3 rounded-full shrink-0 shadow-sm",
            PROPERTY_STATUS_STYLES[s].dot,
          )}
        />
        <div className="flex flex-col items-start gap-0.5 min-w-0 ">
          <span
            className={cn(
              "text-sm font-bold text-slate-900",
              value === s && "text-blue-600",
            )}
          >
            {PROPERTY_STATUS_LABELS[s]}
          </span>
          <p className="text-[10px] text-slate-400 font-medium text-left truncate max-w-[200px]">
            เปลี่ยนสถานะเป็น {PROPERTY_STATUS_LABELS[s]}
          </p>
        </div>
      </div>
      {value === s && (
        <div className="bg-blue-600 rounded-full p-0.5">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="เปลี่ยนสถานะทรัพย์"
        description="เลือกสถานะที่ต้องการแสดงสำหรับทรัพย์นี้ (เลือกสถานะเพื่ออัปเดต)"
        trigger={
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            className={cn(
              "h-8 rounded-full w-full px-3 shadow-sm font-bold text-[11px] border-slate-200",
              "transition-all active:scale-95 hover:text-slate-600 group",
              statusTone(value),
              props.className,
            )}
          >
            <div className="flex items-center gap-2">
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              <div
                className={cn(
                  "h-2 w-2 rounded-full shrink-0 shadow-sm group-hover:scale-110 transition-transform",
                  currentStyle.dot,
                )}
              />
              <span className="truncate flex-1 ">{label}</span>
            </div>
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-4 px-6 mb-10 sm:px-1 max-w-lg mx-auto sm:max-w-none h-[calc(70vh-200px)] lg:h-full overflow-y-auto">
          {[
            {
              title: "สถานะการขาย (Active)",
              statuses: ["ACTIVE"] as PropertyStatus[],
            },
            {
              title: "อยู่ระหว่างจอง (Negotiating)",
              statuses: ["UNDER_OFFER", "RESERVED"] as PropertyStatus[],
            },
            {
              title: "ปิดดีล (Closed Deal)",
              statuses: ["SOLD", "RENTED"] as PropertyStatus[],
            },
            {
              title: "อื่น ๆ (Others)",
              statuses: ["DRAFT", "ARCHIVED"] as PropertyStatus[],
            },
          ].map((group) => (
            <div
              key={group.title}
              className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-2"
            >
              <div className="col-span-full mb-1">
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <div className="h-4 w-1 bg-blue-600 rounded-full" />
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </h4>
                </div>
                <div className="h-px bg-slate-100 w-full" />
              </div>
              {group.statuses.map((s) => (
                <StatusItem
                  key={s}
                  s={s}
                  onClick={() => {
                    setOpen(false);
                    onSelectStatus(s);
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </ResponsiveDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl max-w-sm sm:max-w-md mx-auto overflow-hidden border-none shadow-2xl">
          <div className="p-1 sm:p-2">
            <AlertDialogHeader className="text-center sm:text-left space-y-4">
              <div className="mx-auto sm:mx-0 w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Check className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <AlertDialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  ยืนยันการตั้งเป็น ACTIVE?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 leading-relaxed font-semibold text-sm sm:text-base">
                  เมื่อเป็น **ACTIVE** ทรัพย์นี้จะถูกแสดงบนหน้า Public
                  และผู้ใช้ทั่วไปสามารถมองเห็นได้
                  กรุณาตรวจสอบรายละเอียดให้เรียบร้อย
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3 mt-8 pt-2">
              <AlertDialogCancel
                className="w-full sm:w-1/2 rounded-2xl h-12 font-bold border-slate-100 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95 border-none"
                onClick={() => {
                  setPendingStatus(null);
                  setConfirmOpen(false);
                }}
              >
                ยกเลิก
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={isPending}
                className="w-full sm:w-1/2 h-12 rounded-2xl bg-blue-600 font-bold hover:bg-blue-700 shadow-xl shadow-blue-200/50 text-white transition-all active:scale-95"
                onClick={() => {
                  if (!pendingStatus) return;
                  setConfirmOpen(false);
                  const nextStatus = pendingStatus;
                  setPendingStatus(null);
                  commitChange(nextStatus);
                }}
              >
                ยืนยันการออนไลน์
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
