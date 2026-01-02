"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_ORDER,
} from "@/features/properties/labels";

import type { PropertyStatus } from "@/features/properties/types";
import { updatePropertyStatusAction } from "@/features/properties/actions";
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
  switch (status) {
    case "ACTIVE":
      return "bg-green-50 text-green-700 border-green-200";
    case "DRAFT":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "UNDER_OFFER":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "RESERVED":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "SOLD":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "RENTED":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "ARCHIVED":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function PropertyStatusSelect(props: {
  id: string;
  value: PropertyStatus;
}) {
  const [value, setValue] = useState<PropertyStatus>(props.value);
  const [isPending, startTransition] = useTransition();

  const label = useMemo(() => PROPERTY_STATUS_LABELS[value], [value]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PropertyStatus | null>(
    null
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

  return (
    <>
      <Select value={value} onValueChange={onSelectStatus} disabled={isPending}>
        <SelectTrigger
          size="sm"
          className={cn(
            "h-8 w-[150px] rounded-full px-3 shadow-none",
            "transition-colors",
            statusTone(value)
          )}
          aria-label="เปลี่ยนสถานะทรัพย์"
        >
          <SelectValue>{label}</SelectValue>
        </SelectTrigger>

        <SelectContent align="end">
          {PROPERTY_STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {PROPERTY_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันเปลี่ยนสถานะเป็น ACTIVE?</AlertDialogTitle>
            <AlertDialogDescription>
              เมื่อเป็น ACTIVE ทรัพย์นี้จะถูกแสดงบนหน้า Public (เช่น
              /properties) ตามเงื่อนไขที่คุณตั้งไว้
              กรุณาตรวจสอบรายละเอียดและรูปภาพให้เรียบร้อยก่อนเผยแพร่
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingStatus(null);
                setConfirmOpen(false);
              }}
            >
              ยกเลิก
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isPending}
              onClick={() => {
                if (!pendingStatus) return;
                setConfirmOpen(false);
                const nextStatus = pendingStatus;
                setPendingStatus(null);
                commitChange(nextStatus);
              }}
            >
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
