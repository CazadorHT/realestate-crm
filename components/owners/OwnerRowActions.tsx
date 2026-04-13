"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteOwnerAction } from "@/features/owners/actions";
import { transferOwnerBranchAction } from "@/lib/actions/transfer-branch-action";
import { TransferBranchDialog } from "@/components/shared/TransferBranchDialog";
import { Edit, Trash2, Eye, ArrowRightLeft, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { EditOwnerDialog } from "@/components/owners/EditOwnerDialog";
import { Owner } from "@/features/owners/types";
import { useIsMobile } from "@/hooks/use-mobile";

type OwnerRowActionsProps = {
  owner: Owner;
  isAdmin?: boolean;
  isMultiTenant?: boolean;
};

export function OwnerRowActions({
  owner,
  isAdmin,
  isMultiTenant,
}: OwnerRowActionsProps) {
  const { id, full_name: fullName, tenant_id: tenantId } = owner;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const showTransferButton = isAdmin && isMultiTenant;

  const onDelete = async () => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const res = await deleteOwnerAction(id);
          if (!res?.success) throw new Error(res?.message || "Delete failed");
          toast.success("ลบข้อมูลเจ้าของเรียบร้อยแล้ว");
          router.refresh();
        } catch (e: any) {
          toast.error(e.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
        } finally {
          resolve();
        }
      });
    });
  };

  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const actions = (
    <div className={isMobile ? "grid gap-2 px-4" : "flex justify-end gap-2"}>
      <Button
        variant="ghost"
        className={isMobile ? "w-full justify-start h-12 px-4 text-[15px] font-bold rounded-xl" : "h-9 w-9"}
        size={isMobile ? "default" : "icon"}
        asChild
        onClick={() => isMobile && setIsMenuOpen(false)}
      >
        <Link href={`/protected/owners/${id}`}>
          <Eye className={isMobile ? "mr-3 h-5 w-5 text-slate-400" : "h-4 w-4"} />
          {isMobile && "ดูรายละเอียด"}
        </Link>
      </Button>

      <Button
        variant="ghost"
        className={
          isMobile
            ? "w-full justify-start h-12 px-4 text-[15px] font-bold rounded-xl"
            : "h-9 w-9"
        }
        size={isMobile ? "default" : "icon"}
        onClick={() => {
          if (isMobile) {
            setIsMenuOpen(false);
          }
          setShowEditDialog(true);
        }}
      >
        <Edit
          className={isMobile ? "mr-3 h-5 w-5 text-slate-400" : "h-4 w-4"}
        />
        {isMobile && "แก้ไขข้อมูล"}
      </Button>

      {showTransferButton && (
        <Button
          variant="ghost"
          className={isMobile ? "w-full justify-start h-12 px-4 text-[15px] font-bold rounded-xl text-blue-600" : "h-9 w-9"}
          size={isMobile ? "default" : "icon"}
          onClick={() => {
            setIsMenuOpen(false);
            setShowTransferDialog(true);
          }}
        >
          <ArrowRightLeft className={isMobile ? "mr-3 h-5 w-5" : "h-4 w-4 text-blue-600"} />
          {isMobile && "ย้ายสาขา"}
        </Button>
      )}

      {isMobile && <div className="h-px bg-slate-100 my-1 mx-2" />}

      <Button
        variant="ghost"
        className={isMobile ? "w-full justify-start h-12 px-4 text-[15px] font-bold rounded-xl text-destructive hover:bg-destructive/5" : "h-9 w-9"}
        size={isMobile ? "default" : "icon"}
        disabled={isPending}
        onClick={() => {
          setIsMenuOpen(false);
          setShowDeleteDialog(true);
        }}
      >
        <Trash2 className={isMobile ? "mr-3 h-5 w-5" : "h-4 w-4 text-destructive"} />
        {isMobile && "ลบเจ้าของ"}
      </Button>
    </div>
  );

  return (
    <>
      {!isMobile ? actions : (
        <ResponsiveDialog
          open={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          title={fullName || "จัดการเจ้าของ"}
          trigger={
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100">
              <MoreHorizontal className="h-5 w-5 text-slate-500" />
            </Button>
          }
        >
          <div className="pb-8">
            {actions}
          </div>
        </ResponsiveDialog>
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="ยืนยันการลบ"
        description={
          <div className="space-y-3">
            <p className="font-medium text-slate-600">
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-bold text-slate-900">{fullName ? `"${fullName}"` : "เจ้าของรายนี้"}</span>?
            </p>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700 leading-relaxed italic">
              * ทรัพย์ที่เชื่อมโยงกับเจ้าของท่านนี้จะไม่ถูกลบ แต่จะไม่มีเจ้าของระบุในระบบ
            </div>
          </div>
        }
        confirmText={isPending ? "กำลังลบ..." : "ลบข้อมูล"}
        cancelText="ยกเลิก"
        variant="destructive"
        onConfirm={onDelete}
      />

      <EditOwnerDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        owner={owner}
      />

      {showTransferButton && (
        <TransferBranchDialog
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
          entityId={id}
          entityName={fullName || "เจ้าของทรัพย์"}
          currentTenantId={tenantId}
          onTransfer={transferOwnerBranchAction}
        />
      )}
    </>
  );
}
