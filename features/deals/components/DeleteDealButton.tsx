"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { deleteDealAction } from "@/features/deals/actions";

interface DeleteDealButtonProps {
  dealId: string;
  leadId?: string;
  /** optional client-side callback executed after successful delete */
  onSuccess?: () => void;
  /** optional path to redirect to after delete (client-side) */
  redirectPath?: string;
  /** Show only icon without text (for compact inline use) */
  iconOnly?: boolean;
}

export function DeleteDealButton({
  dealId,
  leadId,
  onSuccess,
  redirectPath,
  iconOnly,
}: DeleteDealButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteDealAction(dealId, leadId ?? "");
    if (result.success) {
      toast.success("ลบดีลเรียบร้อย");
      setOpen(false);
      setIsDeleting(false);
      if (onSuccess) {
        try {
          onSuccess();
        } catch (e) {
          console.warn("onSuccess callback failed:", e);
        }
      } else if (redirectPath) {
        router.push(redirectPath);
      } else {
        // default: refresh current route so UI updates without forcing navigation
        router.refresh();
      }
    } else {
      toast.error(result.message || "ลบไม่สำเร็จ");
      setIsDeleting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="ยืนยันการลบดีล"
      description="การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลดีลและเอกสารที่เกี่ยวข้องจะถูกลบออกจากระบบถาวร"
      trigger={
        iconOnly ? (
          <Button
            variant="ghost"
            className="h-11 w-11 bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 border-0 cursor-pointer transition-all hover:scale-105 active:scale-95 rounded-xl"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="bg-slate-100 text-slate-600 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all hover:scale-105 active:scale-95 rounded-xl px-4"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            ลบดีล
          </Button>
        )
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
            className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
            className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
          >
            {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
          </Button>
        </div>
      }
    />
  );
}
