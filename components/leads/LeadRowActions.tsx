"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteLeadAction } from "@/features/leads/actions";
import { Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

type LeadRowActionsProps = {
  id: string;
  fullName?: string | null;
};

export function LeadRowActions({ id, fullName }: LeadRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const onDelete = () =>
    startTransition(async () => {
      try {
        const res = await deleteLeadAction(id);
        if (!res?.success) throw new Error(res?.message || "Delete failed");
        toast.success("ลบ Lead เรียบร้อยแล้ว");
        router.refresh();
      } catch (e: any) {
        toast.error(e.message || "เกิดข้อผิดพลาดในการลบ Lead");
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
          aria-label="Open lead"
          title="Open"
        >
          <Link href={`/protected/leads/${id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>

        {/* Edit */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Edit lead"
          title="Edit"
        >
          <Link href={`/protected/leads/${id}/edit`}>
            <Edit className="h-4 w-4" />
          </Link>
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label="Delete lead"
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
