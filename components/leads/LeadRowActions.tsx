"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteLeadAction } from "@/features/leads/actions";
import { Edit, Trash2, Eye, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

type LeadRowActionsProps = {
  id: string;
  fullName?: string | null;
};

export function LeadRowActions({ id, fullName }: LeadRowActionsProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const onDelete = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const res = await deleteLeadAction({ id });
          if (!res?.success) throw new Error(res?.error || "Delete failed");
          toast.success("ลบ Lead เรียบร้อยแล้ว");
          const url = new URL(window.location.href);
          url.searchParams.set("success", "true");
          router.push(url.pathname + url.search);
          router.refresh();
        } catch (e: any) {
          toast.error(e.message || "เกิดข้อผิดพลาดในการลบ Lead");
        } finally {
          resolve();
        }
      });
    });
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <ResponsiveDialog
        open={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        title={fullName || "จัดการ Lead"}
        trigger={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100" title="เปิดเมนู">
            <MoreHorizontal className="h-5 w-5 text-slate-500" />
          </Button>
        }
      >
        <div className="grid gap-2 pb-8">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 px-4 text-[15px] font-bold rounded-xl hover:bg-slate-100 transition-colors"
            asChild
            onClick={() => setIsMenuOpen(false)}
          >
            <Link href={`/protected/leads/${id}`}>
              <Eye className="mr-3 h-5 w-5 text-slate-400" />
              ดูรายละเอียด
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-12 px-4 text-[15px] font-bold rounded-xl hover:bg-slate-100 transition-colors"
            asChild
            onClick={() => setIsMenuOpen(false)}
          >
            <Link href={`/protected/leads/${id}/edit`}>
              <Edit className="mr-3 h-5 w-5 text-slate-400" />
              แก้ไขข้อมูล
            </Link>
          </Button>

          <div className="h-px bg-slate-100 my-1 mx-2" />

          <Button
            variant="ghost"
            className="w-full justify-start h-12 px-4 text-[15px] font-bold rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5 transition-colors"
            onClick={() => {
              setIsMenuOpen(false);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="mr-3 h-5 w-5" />
            ลบรายงานนี้
          </Button>
        </div>
      </ResponsiveDialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="ยืนยันการลบ"
        description={
          <>
            คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
            {fullName ? `"${fullName}"` : "Lead นี้"}?
            <br />
            การลบจะไม่สามารถกู้คืนได้
          </>
        }
        confirmText={isPending ? "กำลังลบ..." : "ลบ"}
        cancelText="ยกเลิก"
        variant="destructive"
        onConfirm={onDelete}
      />
    </>
  );
}
