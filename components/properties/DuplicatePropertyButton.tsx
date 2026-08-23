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
import { useLanguage } from "@/components/providers/LanguageProvider";

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
  const { language } = useLanguage();
  const isEn = language === "en";

  const onDuplicate = async () => {
    async function execute() {
      const processId = startProcess(
        isEn ? `Duplicating property${title ? ` "${title}"` : ""}` : `คัดลอกข้อมูลทรัพย์${title ? ` "${title}"` : ""}`,
        { 
          type: "DUPLICATE",
          onRetry: execute
        }
      );
      
      try {
        const res = await duplicatePropertyAction(id);
        if (!res.success || !res.propertyId) {
          finishProcess(processId, "ERROR", res.message || (isEn ? "Duplicate failed" : "Duplicate ไม่สำเร็จ"));
          throw new Error(res.message || (isEn ? "Duplicate failed" : "Duplicate ไม่สำเร็จ"));
        }
        finishProcess(processId, "SUCCESS", isEn ? "Duplicate created successfully" : "สร้างสำเนาเรียบร้อย");
        router.push(`/protected/properties#table`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : (isEn ? "Error duplicating property" : "เกิดข้อผิดพลาดในการคัดลอก");
        finishProcess(processId, "ERROR", msg);
      }
    }
    await execute();
  };

  return (
    <ConfirmDialog
      title={isEn ? "Confirm Duplicate Listing" : "ยืนยันการคัดลอกทรัพย์"}
      description={
        <span>
          {isEn ? (
            <>
              Are you sure you want to create a duplicate of{" "}
              {title ? (
                <strong className="text-blue-600 font-bold">"{title}"</strong>
              ) : (
                "this property"
              )}? Basic information, photos, amenities, and agent will be cloned into a new listing with Draft status.
            </>
          ) : (
            <>
              คุณต้องการสร้างสำเนาของทรัพย์{" "}
              {title ? (
                <strong className="text-blue-600 font-bold">"{title}"</strong>
              ) : (
                "นี้"
              )}{" "}
              ใช่หรือไม่? ข้อมูลพื้นฐาน รูปภาพ เอเจนต์ และสิ่งอำนวยความสะดวกจะถูกคัดลอกไปยังบ้านหลังใหม่ในสถานะ Draft
            </>
          )}
        </span>
      }
      confirmText={isEn ? "Duplicate Listing" : "คัดลอกทรัพย์"}
      cancelText={isEn ? "Cancel" : "ยกเลิก"}
      onConfirm={onDuplicate}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isPending}
          className={cn("h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer", className)}
          aria-label={isEn ? "Duplicate" : "คัดลอกทรัพย์"}
          title={isEn ? "Duplicate" : "คัดลอกทรัพย์"}
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
