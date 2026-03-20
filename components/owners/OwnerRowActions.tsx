"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteOwnerAction } from "@/features/owners/actions";
import { transferOwnerBranchAction } from "@/lib/actions/transfer-branch-action";
import { TransferBranchDialog } from "@/components/shared/TransferBranchDialog";
import { Edit, Trash2, Eye, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

type OwnerRowActionsProps = {
  id: string;
  fullName?: string | null;
  tenantId?: string | null;
  isAdmin?: boolean;
  isMultiTenant?: boolean;
};

export function OwnerRowActions({
  id,
  fullName,
  tenantId,
  isAdmin,
  isMultiTenant,
}: OwnerRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const showTransferButton = isAdmin && isMultiTenant;

  const onDelete = () =>
    startTransition(async () => {
      try {
        const res = await deleteOwnerAction(id);
        if (!res?.success) throw new Error(res?.message || "Delete failed");
        toast.success("ลบข้อมูลเจ้าของเรียบร้อยแล้ว");
        router.refresh();
      } catch (e: any) {
        toast.error(e.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
      } finally {
        setShowDeleteDialog(false);
      }
    });

  return (
    <>
      <div className="flex justify-end gap-2">
        {/* View */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="View owner"
          title="View"
        >
          <Link href={`/protected/owners/${id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>

        {/* Edit */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Edit owner"
          title="Edit"
        >
          <Link href={`/protected/owners/${id}/edit`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>

        {/* Transfer Branch — Admin + Multi-tenant only */}
        {showTransferButton && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Transfer branch"
            title="ย้ายสาขา"
            onClick={() => setShowTransferDialog(true)}
          >
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          </Button>
        )}

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label="Delete owner"
          title="Delete"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="ยืนยันการลบ"
        description={
          <>
            คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
            {fullName ? `"${fullName}"` : "เจ้าของรายนี้"}?
            <br />
            ทรัพย์ที่เชื่อมโยงกับเจ้าของท่านนี้จะไม่ถูกลบ แต่จะไม่มีเจ้าของระบุ
          </>
        }
        confirmText={isPending ? "กำลังลบ..." : "ลบ"}
        cancelText="ยกเลิก"
        variant="destructive"
        onConfirm={onDelete}
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
