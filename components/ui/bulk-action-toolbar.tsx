"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => Promise<void>;
  entityName?: string; // เช่น "ทรัพย์", "ลีด", "ดีล"
  className?: string;
}

export function BulkActionToolbar({
  selectedCount,
  onClear,
  onDelete,
  entityName = "รายการ",
  className,
}: BulkActionToolbarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (selectedCount === 0) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-top-2 duration-200",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-700">
            เลือก {selectedCount} {entityName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-8 text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            ลบทั้งหมด
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณกำลังจะลบ{" "}
              <strong className="text-foreground">
                {selectedCount} {entityName}
              </strong>{" "}
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  ลบ {selectedCount} {entityName}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
