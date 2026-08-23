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
import { useLanguage } from "@/components/providers/LanguageProvider";

type LeadRowActionsProps = {
  id: string;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
};

export function LeadRowActions({ id, fullName, phone, email }: LeadRowActionsProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const onDelete = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const res = await deleteLeadAction({ id });
          if (!res?.success) throw new Error(res?.error || "Delete failed");
          toast.success(isEn ? "Lead deleted successfully" : "ลบ Lead เรียบร้อยแล้ว");
          const url = new URL(window.location.href);
          url.searchParams.set("success", "true");
          router.push(url.pathname + url.search);
          router.refresh();
        } catch (e: any) {
          toast.error(e.message || (isEn ? "Error deleting lead" : "เกิดข้อผิดพลาดในการลบ Lead"));
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
        title={fullName || (isEn ? "Manage Lead" : "จัดการ Lead")}
        description={
          <div className="flex flex-col gap-0.5 mt-1">
             <div className="text-slate-500 font-medium">{phone || email || (isEn ? "Customer details" : "ข้อมูลลูกค้า")}</div>
          </div>
        }
        className="sm:max-w-sm!"
        trigger={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100 cursor-pointer" title={isEn ? "Open menu" : "เปิดเมนู"}>
            <MoreHorizontal className="h-5 w-5 text-slate-500" />
          </Button>
        }
      >
        <div className="flex flex-col gap-1.5 p-6 ">
          <div className="px-3 mb-2">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
              {isEn ? "Management Options" : "ตัวเลือกการจัดการ"}
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4 px-4 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center gap-4 group cursor-pointer"
            asChild
            onClick={() => setIsMenuOpen(false)}
          >
            <Link href={`/protected/leads/${id}`}>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Eye className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[15px] font-bold text-slate-800">
                  {isEn ? "View Details" : "ดูรายละเอียด"}
                </span>
                <span className="text-xs text-slate-500 font-medium mt-0.5">
                  {isEn ? "Insights and activity history" : "ข้อมูลเชิงลึกและประวัติกิจกรรม"}
                </span>
              </div>
            </Link>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4 px-4 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center gap-4 group cursor-pointer"
            asChild
            onClick={() => setIsMenuOpen(false)}
          >
            <Link href={`/protected/leads/${id}/edit`}>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Edit className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[15px] font-bold text-slate-800">
                  {isEn ? "Edit Lead" : "แก้ไขข้อมูล"}
                </span>
                <span className="text-xs text-slate-500 font-medium mt-0.5">
                  {isEn ? "Update customer profile and status" : "ปรับปรุงข้อมูลลูกค้าและสถานะ"}
                </span>
              </div>
            </Link>
          </Button>

          <div className="h-px bg-slate-100 my-2 mx-4" />

          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4 px-4 rounded-2xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all flex items-center gap-4 group cursor-pointer"
            onClick={() => {
              setIsMenuOpen(false);
              setShowDeleteDialog(true);
            }}
          >
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[15px] font-bold text-rose-600">
                {isEn ? "Delete this Lead" : "ลบรายงานนี้"}
              </span>
              <span className="text-xs text-rose-400 font-medium mt-0.5">
                {isEn ? "This action cannot be undone" : "การกระทำนี้ไม่สามารถกู้คืนได้"}
              </span>
            </div>
          </Button>
        </div>
      </ResponsiveDialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={isEn ? "Confirm Deletion" : "ยืนยันการลบ"}
        description={
          isEn ? (
            <>
              Are you sure you want to delete {fullName ? `"${fullName}"` : "this lead"}?
              <br />
              This action cannot be undone.
            </>
          ) : (
            <>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              {fullName ? `"${fullName}"` : "Lead นี้"}?
              <br />
              การลบจะไม่สามารถกู้คืนได้
            </>
          )
        }
        confirmText={isPending ? (isEn ? "Deleting..." : "กำลังลบ...") : (isEn ? "Delete" : "ลบ")}
        cancelText={isEn ? "Cancel" : "ยกเลิก"}
        variant="destructive"
        onConfirm={onDelete}
      />
    </>
  );
}
