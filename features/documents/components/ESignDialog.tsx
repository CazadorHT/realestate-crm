"use client";

import { useState } from "react";
import { initiateESignAction, syncESignStatusAction } from "../esign-actions";
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
  RefreshCw,
  Loader2,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ESignDialogProps {
  documentId: string;
  documentName: string;
  currentStatus?: string | null;
  recipientEmail?: string | null;
}

export function ESignDialog({
  documentId,
  documentName,
  currentStatus,
  recipientEmail,
}: ESignDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  const handleInitiate = async () => {
    setLoading(true);
    try {
      const res = await initiateESignAction(documentId);
      if (res.success) {
        toast.success("ส่งสัญญาไปเซ็นออนไลน์เรียบร้อยแล้ว!");
        setStatus(res.status);
      } else {
        toast.error(res.message || "ส่งสัญญาไม่สำเร็จ");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ e-Signature");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await syncESignStatusAction(documentId);
      if (res.success) {
        toast.success("อัปเดตสถานะล่าสุดแล้ว");
        setStatus(res.status);
      } else {
        toast.error(res.message || "อัปเดตสถานะไม่สำเร็จ");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบสถานะ");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (s: string | null | undefined) => {
    switch (s) {
      case "SIGNED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            เซ็นแล้ว
          </Badge>
        );
      case "SENT":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            ส่งแล้ว/รอเซ็น
          </Badge>
        );
      case "DECLINED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            ปฏิเสธ
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200">
            หมดอายุ
          </Badge>
        );
      default:
        return <Badge variant="outline">ยังไม่ได้ส่งเซ็น</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-indigo-600"
        >
          <PenTool className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-fit min-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-indigo-600" />
            e-Signature (ลงนามออนไลน์)
          </DialogTitle>
          <DialogDescription>
            จัดการการส่งสัญญาเพื่อให้ลูกค้าเซ็นออนไลน์ผ่าน Adobe Sign หรือ NDID
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="p-3 border rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
              เอกสาร:
            </p>
            <p className="text-sm font-semibold truncate text-slate-800">
              {documentName}
            </p>
            <div className="mt-2">
              {statusBadge(status)}
              {status === "SIGNED" && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-green-600 font-bold bg-green-50 p-1 rounded border border-green-100">
                  <CheckCircle className="h-3 w-3" />
                  ยืนยันตัวตนและลงนามเสร็จสมบูรณ์
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Warning if not a contract-like document */}
            {!status || status === "DRAFT" ? (
              <>
                {!documentName.toLowerCase().includes("contract") &&
                  !documentName.toLowerCase().includes("lease") &&
                  !documentName.toLowerCase().includes("sale") &&
                  !documentName.toLowerCase().includes("reservation") && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded text-[10px] text-amber-700">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                      <span>
                        <strong>ข้อสังเกต:</strong> ชื่อไฟล์ดูเหมือนไม่ใช่สัญญา
                        คุณแน่ใจหรือไม่ว่าต้องการส่งเอกสารนี้ให้ลูกค้าเซ็นออนไลน์?
                      </span>
                    </div>
                  )}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <Mail className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-blue-900">
                        ส่งอีเมลแจ้งเซ็นสัญญา
                      </p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        ระบบจะส่งลิงก์สำหรับลงนามไปยังอีเมลของลูกค้า:
                        <strong className="block mt-1">
                          {recipientEmail || "ยังไม่มีข้อมูลอีเมล"}
                        </strong>
                      </p>
                      {!recipientEmail && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-100">
                          <AlertCircle className="h-3 w-3" />
                          กรุณาเพิ่มอีเมลที่ข้อมูลลีดก่อนส่งเซ็น
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {status === "SIGNED" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                  )}
                  <div>
                    <p className="text-sm font-bold">
                      {status === "SIGNED"
                        ? "ดำเนินการเสร็จสิ้น"
                        : "อยู่ระหว่างดำเนินการ"}
                    </p>
                    <p className="text-xs text-slate-500">
                      อัปเดตสถานะล่าสุดเพื่อตรวจสอบ
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSync}
                  disabled={loading}
                  className="h-8 gap-1"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                  />
                  เช็คสถานะ
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            ปิด
          </Button>
          {(!status || status === "DRAFT") && (
            <Button
              onClick={handleInitiate}
              disabled={loading || !recipientEmail}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  เริ่มส่งเซ็นสัญญา
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
