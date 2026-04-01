"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CopyPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicatePropertyAction } from "@/features/properties/actions";
import { cn } from "@/lib/utils";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DuplicatePropertyButton({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDuplicate = async () => {
    const res = await duplicatePropertyAction(id);
    if (!res.success || !res.propertyId) {
      toast.error(res.message || "Duplicate ไม่สำเร็จ");
      throw new Error(res.message || "Duplicate ไม่สำเร็จ");
    }
    toast.success("สร้างสำเนาเรียบร้อย");
    window.location.href = `/protected/properties#table`;
  };

  return (
    <ConfirmDialog
      title="ยืนยันการคัดลอกทรัพย์"
      description="คุณต้องการสร้างสำเนาของทรัพย์นี้ใช่หรือไม่? ข้อมูลพื้นฐาน รูปภาพ เอเจนต์ และสิ่งอำนวยความสะดวกจะถูกคัดลอกไปยังบ้านหลังใหม่ในสถานะ Draft"
      confirmText="คัดลอกทรัพย์"
      cancelText="ยกเลิก"
      onConfirm={onDuplicate}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isPending}
          className={cn("h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50", className)}
          aria-label="Duplicate"
          title="Duplicate"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CopyPlus className="h-4 w-4" />
          )}
        </Button>
      }
    />
  );
}
