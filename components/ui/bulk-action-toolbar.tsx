"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2, Download } from "lucide-react";
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
import { toast } from "sonner";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => Promise<void>;
  onExport?: () => Promise<{
    success: boolean;
    data?: string;
    filename?: string;
    message?: string;
  }>;
  entityName?: string; // เช่น "ทรัพย์", "ลีด", "ดีล"
  className?: string;
  confirmMessage?: React.ReactNode;
  actionableCount?: number;
}

export function BulkActionToolbar({
  selectedCount,
  onClear,
  onDelete,
  onExport,
  entityName = "รายการ",
  className,
  confirmMessage,
  actionableCount,
}: BulkActionToolbarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Use actionableCount if provided, otherwise fallback to selectedCount
  const countToDelete = actionableCount ?? selectedCount;

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

  const handleExport = async () => {
    if (!onExport) return;
    setIsExporting(true);
    try {
      const result = await onExport();
      if (result.success && result.data && result.filename) {
        // Convert base64 to blob and download
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`Export สำเร็จ ${selectedCount} ${entityName}`);
      } else {
        toast.error(result.message || "Export ไม่สำเร็จ");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการ export");
    } finally {
      setIsExporting(false);
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
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-8 text-xs bg-white hover:bg-green-50 border-green-200 text-green-700"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1" />
              )}
              Export Excel
            </Button>
          )}
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
              {confirmMessage ? (
                confirmMessage
              ) : (
                <>
                  คุณกำลังจะลบ{" "}
                  <strong className="text-foreground">
                    {selectedCount} {entityName}
                  </strong>{" "}
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </>
              )}
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
                  ลบ {countToDelete} {entityName}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
