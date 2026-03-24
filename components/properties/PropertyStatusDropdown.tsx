"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  PROPERTY_STATUS_STYLES,
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
  const style = PROPERTY_STATUS_STYLES[status] || PROPERTY_STATUS_STYLES.DRAFT;
  return cn(style.bg, style.border);
}

export function PropertyStatusSelect(props: {
  id: string;
  value: PropertyStatus;
  className?: string;
}) {
  const [value, setValue] = useState<PropertyStatus>(props.value);
  const [isPending, startTransition] = useTransition();

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
            "h-8 w-[120px] rounded-full px-3 shadow-none",
            "transition-colors",
            statusTone(value),
            props.className,
          )}
          aria-label="เปลี่ยนสถานะทรัพย์"
        >
          <SelectValue>
            <div className="flex items-center gap-2">
              {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              {label}
            </div>
          </SelectValue>
        </SelectTrigger>

        <SelectContent align="end" className="min-w-[160px]">
          {PROPERTY_STATUS_ORDER.map((s) => (
            <SelectItem key={s} value={s} className="cursor-pointer">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    PROPERTY_STATUS_STYLES[s].dot,
                  )}
                />
                <span className="text-xs font-medium">
                  {PROPERTY_STATUS_LABELS[s]}
                </span>
              </div>
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
