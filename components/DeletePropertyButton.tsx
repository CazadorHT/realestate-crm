"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deletePropertyAction } from "@/features/properties/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function DeletePropertyButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const onDelete = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", id);
        const res = await deletePropertyAction(formData);

        if (res.success) {
          toast.success(res.message || "ลบข้อมูลทรัพย์เรียบร้อยแล้ว");
          router.refresh();
        } else {
          toast.error(res.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
        }
      } catch (e: any) {
        toast.error(e.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
      } finally {
        setShowConfirm(false);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {isPending ? "กำลังลบ..." : "ลบ"}
      </Button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="ยืนยันการลบ"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทรัพย์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText={isPending ? "กำลังลบ..." : "ลบ"}
        cancelText="ยกเลิก"
        variant="destructive"
        onConfirm={onDelete}
        
      />
    </>
  );
}
