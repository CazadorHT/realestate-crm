"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { softDeleteProperty } from "@/features/properties/actions/property-trash";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function DeletePropertyMenuItem({ 
  id,
  onDeleteStart 
}: { 
  id: string;
  onDeleteStart?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const onConfirm = async () => {
    const res = await softDeleteProperty(id);
    if (res.success) {
      toast.success("ย้ายทรัพย์ลงถังขยะเรียบร้อยแล้ว");
      handleSuccessFeedback();
    } else {
      toast.error(res.error || "เกิดข้อผิดพลาดในการลบ");
      throw new Error(res.error || "เกิดข้อผิดพลาดในการลบ");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start h-11 px-4 text-[15px] font-medium text-destructive hover:text-destructive hover:bg-destructive/5 transition-colors"
        onClick={() => {
          onDeleteStart?.();
          setTimeout(() => {
            setOpen(true);
            setIsConfirmed(false); // Reset on open
          }, 150);
        }}
      >
        <Trash2 className="mr-3 h-5 w-5" />
        ลบ (ย้ายลงถังขยะ)
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setIsConfirmed(false); // Reset on close
        }}
        title="ยืนยันการลบ"
        description={
          <div className="space-y-4">
            <div className="space-y-2">
              <p>คุณต้องการย้ายทรัพย์นี้ลงถังขยะใช่หรือไม่? คุณสามารถกู้คืนได้ภายหลังในหน้าถังขยะ (Trash)</p>
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 font-medium leading-relaxed">
                ⚠️ หมายเหตุ: รายการที่มีสถานะ ขายแล้ว/เช่าแล้ว หรือมีดีลที่ปิดแล้ว ไม่สามารถลบได้
              </p>
            </div>
            
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
              <Checkbox 
                id={`confirm-delete-${id}`}
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              />
              <Label 
                htmlFor={`confirm-delete-${id}`}
                className="text-sm font-medium text-slate-700 cursor-pointer select-none"
              >
                ยืนยันความต้องการที่จะลบรายการนี้จริงๆ
              </Label>
            </div>
          </div>
        }
        confirmText="ย้ายลงถังขยะ"
        confirmDisabled={!isConfirmed}
        variant="destructive"
        onConfirm={onConfirm}
      />
    </>
  );
}
