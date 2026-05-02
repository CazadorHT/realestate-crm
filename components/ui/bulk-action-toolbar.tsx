"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { downloadBase64File, MIME_TYPES } from "@/lib/download-utils";

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
  onTransfer?: () => void;
  onPull?: () => Promise<void>;
  onPullLabel?: string;
  onPullConfirmMessage?: React.ReactNode;
  entityName?: string; // เช่น "ทรัพย์", "ลีด", "ดีล"
  className?: string;
  confirmMessage?: React.ReactNode;
  actionableCount?: number;
  onDeleteLabel?: string;
  onAiApprove?: () => Promise<void>;
  onAiApproveLabel?: string;
  extraActions?: React.ReactNode;
}

export function BulkActionToolbar({
  selectedCount,
  onClear,
  onDelete,
  onExport,
  onTransfer,
  onPull,
  onPullLabel = "ดึงมาที่นี่",
  onPullConfirmMessage,
  entityName = "รายการ",
  className,
  confirmMessage,
  actionableCount,
  onDeleteLabel,
  onAiApprove,
  onAiApproveLabel = "ยืนยันผล AI",
  extraActions,
}: BulkActionToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Use actionableCount if provided, otherwise fallback to selectedCount
  const countToDelete = actionableCount ?? selectedCount;

  if (selectedCount === 0) return null;


  const handleExport = async () => {
    if (!onExport) return;
    setIsExporting(true);
    try {
      const result = await onExport();
      if (result.success && result.data && result.filename) {
        const downloaded = downloadBase64File(
          result.data,
          result.filename,
          MIME_TYPES.EXCEL,
        );

        if (downloaded) {
          toast.success(`Export สำเร็จ ${selectedCount} ${entityName}`);
        } else {
          toast.error("ดาวน์โหลดไฟล์ไม่สำเร็จ");
        }
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
          "inline-flex w-full items-center justify-between gap-4 px-4 py-3 md:py-2 bg-blue-600 md:bg-blue-50 border border-blue-700 md:border-blue-200 rounded-xl md:rounded-lg animate-in slide-in-from-top-2 duration-300 shadow-lg md:shadow-sm",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold md:font-medium text-white md:text-blue-700">
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
              className="h-11 text-xs bg-white hover:bg-green-50! border-green-200! text-green-700!"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1" />
              )}
              Export Excel
            </Button>
          )}

          {onPull && (
            <ConfirmDialog
              title="ยืนยันการดึงข้อมูล"
              description={
                onPullConfirmMessage || (
                  <>
                    คุณกำลังจะดึง{" "}
                    <strong className="text-foreground">
                      {selectedCount} {entityName}
                    </strong>{" "}
                    มายังสาขาของคุณ
                  </>
                )
              }
              confirmText={onPullLabel}
              onConfirm={onPull}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 text-xs bg-white hover:bg-blue-50! border-blue-200! text-blue-700! font-medium"
                >
                  <Download className="h-3.5 w-3.5 mr-1 rotate-180" />
                  {onPullLabel}
                </Button>
              }
            />
          )}
          
          {onAiApprove && (
            <ConfirmDialog
              title="Sentinel Verification"
              description={
                <div className="space-y-3">
                  <p>คุณกำลังจะยืนยันข้อมูลที่สร้างโดย AI ทั้งหมด <strong className="text-indigo-600">{selectedCount} รายการ</strong></p>
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">การดำเนินการนี้จะล้างสถานะ "ตรวจร่าง AI" และบันทึกข้อมูลย้อนหลัง (Audit) ว่าคุณเป็นผู้ตรวจสอบ</p>
                </div>
              }
              confirmText={onAiApproveLabel}
              onConfirm={onAiApprove}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 text-xs bg-indigo-50 hover:bg-indigo-100! border-indigo-200! text-indigo-700! font-bold shadow-sm"
                >
                  <span className="mr-1.5 flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                  {onAiApproveLabel}
                </Button>
              }
            />
          )}

          {onTransfer && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTransfer}
              className="h-11 text-xs bg-white hover:bg-blue-50! border-blue-200! text-blue-700! font-medium"
            >
              <Download className="h-3.5 w-3.5 mr-1 rotate-180" />
              โอนย้าย {entityName}
            </Button>
          )}

          {extraActions}

          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-11 text-xs"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            ยกเลิก
          </Button>

          <ConfirmDialog
            title={onDeleteLabel ? "ยืนยันการย้ายลงถังขยะ" : "ยืนยันการลบ"}
            description={
              confirmMessage || (
                <>
                  คุณกำลังจะ{onDeleteLabel ? "ย้าย" : "ลบ"}{" "}
                  <strong className="text-foreground">
                    {selectedCount} {entityName}
                  </strong>{" "}
                  {onDeleteLabel
                    ? "ไปที่ถังขยะ (คุณสามารถกู้คืนได้ภายหลังหน้าถังขยะ)"
                    : "การดำเนินการนี้ไม่สามารถย้อนกลับได้"}
                </>
              )
            }
            confirmText={
              onDeleteLabel
                ? `ลบ ${onDeleteLabel} ${countToDelete} รายการ`
                : `ยืนยันการลบ ${countToDelete} ${entityName}`
            }
            variant="destructive"
            onConfirm={onDelete}
            trigger={
              <Button variant="destructive" size="sm" className="h-11 text-xs font-bold">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {onDeleteLabel || "ลบทั้งหมด"}
              </Button>
            }
          />
        </div>
      </div>
    </>
  );
}
