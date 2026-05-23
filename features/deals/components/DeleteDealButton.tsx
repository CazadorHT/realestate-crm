"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { deleteDealAction } from "@/features/deals/actions";
import { cn } from "@/lib/utils";

interface DeleteDealButtonProps {
  dealId: string;
  leadId?: string;
  propertyName?: string | null;
  customerName?: string | null;
  /** optional client-side callback executed after successful delete */
  onSuccess?: () => void;
  /** optional path to redirect to after delete (client-side) */
  redirectPath?: string;
  /** Show only icon without text (for compact inline use) */
  iconOnly?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function DeleteDealButton({
  dealId,
  leadId,
  propertyName,
  customerName,
  onSuccess,
  redirectPath,
  iconOnly,
  children,
  className,
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
      className="sm:max-w-sm!"
      title="ยืนยันการลบดีล"
      description={
        <div className="space-y-4">
          <p>การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลดีลและเอกสารที่เกี่ยวข้องจะถูกลบออกจากระบบถาวร</p>
          {(propertyName || customerName) && (
            <div className="rounded-2xl bg-slate-50 border border-slate-100/50 p-4 text-xs text-slate-600 space-y-2 text-left shadow-inner">
              {propertyName && (
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-400 shrink-0 w-14">ทรัพย์สิน:</span>{" "}
                  <span className="font-semibold text-slate-800 line-clamp-2">{propertyName}</span>
                </div>
              )}
              {customerName && (
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-400 shrink-0 w-14">ลูกค้า:</span>{" "}
                  <span className="font-semibold text-slate-800">{customerName}</span>
                </div>
              )}
            </div>
          )}
        </div>
      }
      trigger={
        children ? (
          <div className={className}>{children}</div>
        ) : iconOnly ? (
          <Button
            variant="ghost"
            className={cn(
              "h-11 w-11 bg-slate-100 text-slate-500 hover:text-red-600 hover:bg-red-50 border-0 cursor-pointer transition-all hover:scale-105 active:scale-95 rounded-xl",
              className
            )}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "bg-slate-100 text-slate-600 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all hover:scale-105 active:scale-95 rounded-xl px-4",
              className
            )}
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
