"use client";

import { useState } from "react";
import { markAsSignedAction } from "../esign-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  CheckCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ESignDialogProps {
  documentId: string;
  documentName: string;
  currentStatus?: string | null;
}

export function ESignDialog({
  documentId,
  documentName,
  currentStatus,
}: ESignDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const handleManualSign = async () => {
    setLoading(true);
    try {
      const res = await markAsSignedAction(documentId);
      if (res.success) {
        toast.success("อัปเดตสถานะเป็นเซ็นชื่อเรียบร้อยแล้ว");
        setStatus(res.status);
      } else {
        toast.error(res.message || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s: string | null | undefined) => {
    switch (s) {
      case "SIGNED":
        return (
          <Badge className="bg-green-500 text-white border-green-600 shadow-sm">
            <CheckCircle className="h-3 w-3 mr-1" />
            เซ็นสัญญาแล้ว
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-300">
            <Clock className="h-3 w-3 mr-1" />
            รอการเซ็นสัญญา
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 transition-colors ${
            status === "SIGNED"
              ? "text-green-600 hover:text-green-700 hover:bg-green-50"
              : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
          }`}
        >
          <PenTool className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
            <FileCheck className="h-6 w-6 text-blue-600" />
            สถานะการเซ็นสัญญา
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            จัดการสถานะสัญญาหลังจากลูกค้าลงนามหน้างานหรือทางกระดาษแล้ว
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="p-4 border rounded-xl border-slate-200 bg-slate-50/50 shadow-sm">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">
              ชื่อเอกสาร
            </p>
            <p className="text-sm text-slate-800 break-all">{documentName}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">สถานะปัจจุบัน:</span>
              {statusBadge(status)}
            </div>
          </div>

          <div className="space-y-4">
            {status !== "SIGNED" ? (
              <div className="p-4 border border-blue-100 bg-blue-50 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-200">
                    <PenTool className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-900">ยืนยันการเซ็นชื่อ</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      หากลูกค้าเซ็นเอกสารเรียบร้อยแล้ว
                      คุณสามารถกดยืนยันเพื่อบันทึกลงระบบได้ทันที
                    </p>
                  </div>
                </div>
                <ConfirmDialog
                  title="ยืนยันการเซ็นสัญญา"
                  description="คุณแน่ใจหรือไม่ว่าลูกค้าได้เซ็นสัญญานี้เรียบร้อยแล้ว? ระบบจะบันทึกสถานะว่า 'เซ็นแล้ว' และไม่สามารถย้อนกลับได้"
                  onConfirm={handleManualSign}
                  trigger={
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 shadow-lg shadow-blue-200 rounded-xl transition-all active:scale-95"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        "ยืนยันว่าลูกค้าเซ็นแล้ว"
                      )}
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="p-4 border border-green-100 bg-green-50 rounded-2xl flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200 mb-2">
                  <CheckCircle className="h-7 w-7" />
                </div>
                <p className="text-sm text-green-800">
                  ดำเนินการเซ็นสัญญาเรียบร้อย
                </p>
                <p className="text-xs text-green-600">
                  เอกสารนี้ได้รับการยืนยันการลงนามในระบบแล้ว
                </p>
              </div>
            )}

            {/* Warning if not a contract-like document */}
            {status !== "SIGNED" &&
              !documentName.toLowerCase().includes("contract") &&
              !documentName.toLowerCase().includes("lease") &&
              !documentName.toLowerCase().includes("sale") &&
              !documentName.toLowerCase().includes("reservation") && (
                <div className="flex items-start gap-2 p-3 bg-slate-100 rounded-xl text-[10px] text-slate-600 border border-slate-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>
                    หมายเหตุ: ระบบจะบันทึก Log ว่าผู้ใช้เป็นคน Manual
                    สถานะนี้ด้วยตนเองเพื่อความโปร่งใส
                  </span>
                </div>
              )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="w-full text-slate-500 hover:bg-slate-100 rounded-xl"
          >
            ปิดหน้าต่าง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
