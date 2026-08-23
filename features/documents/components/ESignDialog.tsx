"use client";

import { useState } from "react";
import { markAsSignedAction } from "../esign-actions";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  CheckCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/lib/i18n/language-context";

interface ESignDialogProps {
  documentId: string;
  documentName: string;
  currentStatus?: string | null;
  trigger?: React.ReactNode;
}

export function ESignDialog({
  documentId,
  documentName,
  currentStatus,
  trigger,
}: ESignDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const handleManualSign = async () => {
    try {
      const res = await markAsSignedAction(documentId);
      if (res.success) {
        if (res.warning) {
          toast.warning(isEn ? "Saved with warning" : "บันทึกสำเร็จแต่มีคำเตือน", {
            description: res.warning,
            duration: 8000,
          });
        } else {
          toast.success(isEn ? "Updated status to Signed successfully" : "อัปเดตสถานะเป็นเซ็นชื่อเรียบร้อยแล้ว");
        }
        setStatus(res.status);
      } else {
        toast.error(isEn ? "Unable to update status" : "ไม่สามารถอัปเดตสถานะได้", {
          description: res.message,
        });
        throw new Error(res.message || (isEn ? "Unable to update status" : "ไม่สามารถอัปเดตสถานะได้"));
      }
    } catch (err: any) {
      toast.error(isEn ? "An error occurred while saving" : "เกิดข้อผิดพลาดในการบันทึก");
      throw err;
    }
  };

  const statusBadge = (s: string | null | undefined) => {
    switch (s) {
      case "SIGNED":
        return (
          <Badge className="bg-emerald-500 text-white border-emerald-600 shadow-sm rounded-lg font-bold">
            <CheckCircle className="h-3 w-3 mr-1" />
            {isEn ? "Signed" : "เซ็นสัญญาแล้ว"}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-200 rounded-lg font-bold bg-slate-50">
            <Clock className="h-3 w-3 mr-1" />
            {isEn ? "Awaiting Signature" : "รอการเซ็นสัญญา"}
          </Badge>
        );
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger || (
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-xl transition-all cursor-pointer ${
              status === "SIGNED"
                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            }`}
          >
            <PenTool className="h-4.5 w-4.5" />
          </Button>
        )
      }
      title={
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
            <FileCheck className="h-6 w-6" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            {isEn ? "E-Signature Status" : "สถานะการเซ็นสัญญา"}
          </span>
        </div>
      }
      description={isEn ? "Manage contract status after client signs on-site or via physical paper" : "จัดการสถานะสัญญาหลังจากลูกค้าลงนามหน้างานหรือทางกระดาษแล้ว"}
      footer={
        <Button
          variant="ghost"
          onClick={() => setOpen(false)}
          className="w-full text-slate-400 font-bold hover:bg-slate-100 rounded-xl h-12 cursor-pointer"
        >
          {isEn ? "Close Window" : "ปิดหน้าต่าง"}
        </Button>
      }
    >
      <div className="py-2 space-y-6">
        <div className="p-5 border rounded-2xl border-slate-100 bg-slate-50/50 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <FileCheck className="h-20 w-20" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">
            {isEn ? "Document Name" : "ชื่อเอกสาร"}
          </p>
          <p className="text-sm font-bold text-slate-800 break-all relative z-10 leading-relaxed">{documentName}</p>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 relative z-10">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">
              {isEn ? "Current Status" : "สถานะปัจจุบัน"}
            </span>
            {statusBadge(status)}
          </div>
        </div>

        <div className="space-y-4">
          {status !== "SIGNED" ? (
            <div className="p-5 border border-blue-100 bg-blue-50/50 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200 shrink-0">
                  <PenTool className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-blue-900 mb-1">
                    {isEn ? "Confirm Signature" : "ยืนยันการเซ็นชื่อ"}
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    {isEn 
                      ? "If the client has already signed, you can confirm to record it in the system immediately."
                      : "หากลูกค้าเซ็นเอกสารเรียบร้อยแล้ว คุณสามารถกดยืนยันเพื่อบันทึกลงระบบได้ทันที"}
                  </p>
                </div>
              </div>
              <ConfirmDialog
                title={isEn ? "Confirm Contract Signature" : "ยืนยันการเซ็นสัญญา"}
                description={
                  documentName.toLowerCase().includes("contract") ||
                  documentName.toLowerCase().includes("lease") ||
                  documentName.toLowerCase().includes("sale") ||
                  documentName.toLowerCase().includes("reservation")
                    ? (isEn 
                        ? "Are you sure the client has signed this contract? The system will mark it as 'Signed', update the deal to 'Won', and update property inventory automatically."
                        : "คุณแน่ใจหรือไม่ว่าลูกค้าได้เซ็นสัญญานี้เรียบร้อยแล้ว? ระบบจะบันทึกสถานะว่า 'เซ็นแล้ว' และจะปรับสถานะดีลนี้เป็น 'สำเร็จ' พร้อมตัดสต็อกทรัพย์สินให้โดยอัตโนมัติ")
                    : (isEn 
                        ? "Are you sure the client has signed this document? The system will mark it as 'Signed' and this action cannot be undone."
                        : "คุณแน่ใจหรือไม่ว่าลูกค้าได้เซ็นเอกสารนี้เรียบร้อยแล้ว? ระบบจะบันทึกสถานะว่า 'เซ็นแล้ว' และไม่สามารถย้อนกลับได้")
                }
                confirmText={isEn ? "Confirm Signed" : "ยืนยันว่าลูกค้าเซ็นแล้ว"}
                cancelText={isEn ? "Cancel" : "ยกเลิก"}
                onConfirm={handleManualSign}
                trigger={
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 shadow-xl shadow-blue-200/50 rounded-2xl font-black transition-all active:scale-95 cursor-pointer"
                  >
                    {isEn ? "Confirm Client Has Signed" : "ยืนยันว่าลูกค้าเซ็นแล้ว"}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="p-6 border border-emerald-100 bg-emerald-50/50 rounded-3xl flex flex-col items-center text-center space-y-3 shadow-sm">
              <div className="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 mb-2 rotate-3 hover:rotate-0 transition-transform duration-500">
                <CheckCircle className="h-10 w-10" />
              </div>
              <p className="text-base font-black text-emerald-900 leading-tight">
                {isEn ? "Contract Signing Completed" : "ดำเนินการเซ็นสัญญาเรียบร้อย"}
              </p>
              <p className="text-xs font-bold text-emerald-600/80">
                {isEn ? "This document has been verified as signed in the system." : "เอกสารนี้ได้รับการยืนยันการลงนามในระบบแล้ว"}
              </p>
            </div>
          )}

          {/* Warning if not a contract-like document */}
          {status !== "SIGNED" &&
            !documentName.toLowerCase().includes("contract") &&
            !documentName.toLowerCase().includes("lease") &&
            !documentName.toLowerCase().includes("sale") &&
            !documentName.toLowerCase().includes("reservation") && (
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-500 font-bold border border-slate-100">
                <AlertCircle className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="leading-normal italic">
                  {isEn 
                    ? "* Note: The system will create an audit log for manual status changes for verification transparency."
                    : "* หมายเหตุ: ระบบจะบันทึก Log การอัปเดตสถานะด้วยตนเองเพื่อความโปร่งใสในการตรวจสอบย้อนหลัง"}
                </span>
              </div>
            )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}

