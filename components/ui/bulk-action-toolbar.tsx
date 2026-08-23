"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, X, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { downloadBase64File, MIME_TYPES } from "@/lib/download-utils";
import { useLanguage } from "@/lib/i18n/language-context";

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
  entityName?: string; // e.g. "Properties", "Leads", "Deals"
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
  onPullLabel,
  onPullConfirmMessage,
  entityName,
  className,
  confirmMessage,
  actionableCount,
  onDeleteLabel,
  onAiApprove,
  onAiApproveLabel,
  extraActions,
}: BulkActionToolbarProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const defaultEntityName = entityName || (isEn ? "items" : "รายการ");
  const defaultPullLabel = onPullLabel || (isEn ? "Pull here" : "ดึงมาที่นี่");
  const defaultAiApproveLabel = onAiApproveLabel || (isEn ? "Verify AI" : "ยืนยันผล AI");

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
          toast.success(
            isEn
              ? `Exported ${selectedCount} ${defaultEntityName} successfully`
              : `Export สำเร็จ ${selectedCount} ${defaultEntityName}`
          );
        } else {
          toast.error(isEn ? "Failed to download file" : "ดาวน์โหลดไฟล์ไม่สำเร็จ");
        }
      } else {
        toast.error(result.message || (isEn ? "Export failed" : "Export ไม่สำเร็จ"));
      }
    } catch {
      toast.error(isEn ? "Error during export" : "เกิดข้อผิดพลาดในการ export");
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
            {isEn
              ? `Selected ${selectedCount} ${defaultEntityName}`
              : `เลือก ${selectedCount} ${defaultEntityName}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-11 text-xs bg-white hover:bg-green-50! border-green-200! text-green-700! cursor-pointer"
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
              title={isEn ? "Confirm Pull Data" : "ยืนยันการดึงข้อมูล"}
              description={
                onPullConfirmMessage || (
                  <>
                    {isEn ? "You are about to pull " : "คุณกำลังจะดึง "}
                    <strong className="text-foreground">
                      {selectedCount} {defaultEntityName}
                    </strong>{" "}
                    {isEn ? "to your branch" : "มายังสาขาของคุณ"}
                  </>
                )
              }
              confirmText={defaultPullLabel}
              onConfirm={onPull}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 text-xs bg-white hover:bg-blue-50! border-blue-200! text-blue-700! font-medium cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 mr-1 rotate-180" />
                  {defaultPullLabel}
                </Button>
              }
            />
          )}
          
          {onAiApprove && (
            <ConfirmDialog
              title="Sentinel Verification"
              description={
                <div className="space-y-3">
                  <p>
                    {isEn
                      ? `You are about to verify all ${selectedCount} AI-generated items.`
                      : `คุณกำลังจะยืนยันข้อมูลที่สร้างโดย AI ทั้งหมด ${selectedCount} รายการ`}
                  </p>
                  <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                    {isEn
                      ? "This action will clear the 'AI Review' status and record an audit log with your account as reviewer."
                      : "การดำเนินการนี้จะล้างสถานะ \"ตรวจร่าง AI\" และบันทึกข้อมูลย้อนหลัง (Audit) ว่าคุณเป็นผู้ตรวจสอบ"}
                  </p>
                </div>
              }
              confirmText={defaultAiApproveLabel}
              onConfirm={onAiApprove}
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 text-xs bg-indigo-50 hover:bg-indigo-100! border-indigo-200! text-indigo-700! font-bold shadow-sm cursor-pointer"
                >
                  <span className="mr-1.5 flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                  {defaultAiApproveLabel}
                </Button>
              }
            />
          )}

          {onTransfer && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTransfer}
              className="h-11 text-xs bg-white hover:bg-blue-50! border-blue-200! text-blue-700! font-medium cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 mr-1 rotate-180" />
              {isEn ? `Transfer ${defaultEntityName}` : `โอนย้าย ${defaultEntityName}`}
            </Button>
          )}

          {extraActions}

          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-11 text-xs cursor-pointer"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            {isEn ? "Cancel" : "ยกเลิก"}
          </Button>

          <ConfirmDialog
            title={
              onDeleteLabel
                ? (isEn ? "Confirm Move to Trash" : "ยืนยันการย้ายลงถังขยะ")
                : (isEn ? "Confirm Deletion" : "ยืนยันการลบ")
            }
            description={
              confirmMessage || (
                <>
                  {isEn ? "You are about to " : "คุณกำลังจะ"}
                  {onDeleteLabel ? (isEn ? "move " : "ย้าย ") : (isEn ? "delete " : "ลบ ")}
                  <strong className="text-foreground">
                    {selectedCount} {defaultEntityName}
                  </strong>{" "}
                  {onDeleteLabel
                    ? (isEn
                        ? "to Trash (you can restore it later from Trash)"
                        : "ไปที่ถังขยะ (คุณสามารถกู้คืนได้ภายหลังหน้าถังขยะ)")
                    : (isEn
                        ? "This action cannot be undone."
                        : "การดำเนินการนี้ไม่สามารถย้อนกลับได้")}
                </>
              )
            }
            confirmText={
              onDeleteLabel
                ? (isEn ? `Delete ${countToDelete} items` : `ลบ ${onDeleteLabel} ${countToDelete} รายการ`)
                : (isEn ? `Confirm Delete (${countToDelete})` : `ยืนยันการลบ ${countToDelete} ${defaultEntityName}`)
            }
            variant="destructive"
            onConfirm={onDelete}
            trigger={
              <Button variant="destructive" size="sm" className="h-11 text-xs font-bold cursor-pointer">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {onDeleteLabel || (isEn ? "Delete All" : "ลบทั้งหมด")}
              </Button>
            }
          />
        </div>
      </div>
    </>
  );
}

