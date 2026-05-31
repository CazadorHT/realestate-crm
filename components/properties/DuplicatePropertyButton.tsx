"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CopyPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicatePropertyAction } from "@/features/properties/actions";
import { cn } from "@/lib/utils";
import { startProcess, finishProcess } from "@/lib/process-monitor";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DuplicatePropertyButton({
  id,
  title,
  className,
}: {
  id: string;
  title?: string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDuplicate = async () => {
    async function execute() {
      const processId = startProcess(`คัดลอกข้อมูลทรัพย์${title ? ` "${title}"` : ""}`, { 
        type: "DUPLICATE",
        onRetry: execute
      });
      
      try {
        const res = await duplicatePropertyAction(id);
        if (!res.success || !res.propertyId) {
          finishProcess(processId, "ERROR", res.message || "Duplicate ไม่สำเร็จ");
          throw new Error(res.message || "Duplicate ไม่สำเร็จ");
        }
        finishProcess(processId, "SUCCESS", "สร้างสำเนาเรียบร้อย");
        router.push(`/protected/properties#table`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการคัดลอก";
        finishProcess(processId, "ERROR", msg);
      }
    }
    await execute();
  };

  return (
    <ConfirmDialog
      title="ยืนยันการคัดลอกทรัพย์"
      description={
        <span>
          คุณต้องการสร้างสำเนาของทรัพย์{" "}
          {title ? (
            <strong className="text-blue-600 font-bold">"{title}"</strong>
          ) : (
            "นี้"
          )}{" "}
          ใช่หรือไม่? ข้อมูลพื้นฐาน รูปภาพ เอเจนต์ และสิ่งอำนวยความสะดวกจะถูกคัดลอกไปยังบ้านหลังใหม่ในสถานะ Draft
        </span>
      }
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
