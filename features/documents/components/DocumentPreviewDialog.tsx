"use client";

import { useState, useEffect } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Loader2, Maximize2, Download, FileText, ChevronLeft, X } from "lucide-react";
import { downloadDocumentAction, getDocumentSignedUrl } from "../actions";
import { toast } from "sonner";

interface DocumentPreviewDialogProps {
  documentId: string;
  documentName: string;
  storagePath: string;
  trigger?: React.ReactNode;
}

export function DocumentPreviewDialog({
  documentId,
  documentName,
  storagePath,
  trigger,
}: DocumentPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !content) {
      loadContent();
    }
  }, [open]);

  async function loadContent() {
    setLoading(true);
    try {
      const res = await downloadDocumentAction(storagePath);
      if (res.success && res.data) {
        setContent(res.data);
      } else {
        toast.error(res.message || "ไม่สามารถโหลดเนื้อหาเอกสารได้");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการโหลดเอกสาร");
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow && content) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      // Wait for resources (fonts/styles) to load
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handleDownload = async () => {
    const url = await getDocumentSignedUrl(storagePath);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("ไม่สามารถดาวน์โหลดไฟล์ได้");
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      className="sm:max-w-7xl! h-[96vh] flex flex-col overflow-hidden"
      trigger={
        trigger || (
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
          >
            <Eye className="h-4.5 w-4.5" />
          </Button>
        )
      }
      title={
        <div className="flex items-center gap-3 w-full pr-12">
          <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-black text-slate-900 tracking-tight truncate leading-tight">ดูตัวอย่างเอกสาร</span>
            <span className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5 tracking-wider">{documentName}</span>
          </div>
        </div>
      }
      footer={
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full shrink-0">
          <Button
            variant="outline"
            size="lg"
            onClick={handleDownload}
            className="h-12 flex-1 sm:flex-none gap-2 rounded-2xl border-slate-200 font-bold text-slate-600 bg-white"
          >
            <Download className="h-4 w-4" />
            ดาวน์โหลด
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrint}
            disabled={!content}
            className="h-12 flex-1 sm:flex-none gap-2 rounded-2xl border-slate-200 font-bold text-slate-600 bg-white"
          >
            <Printer className="h-4 w-4" />
            พิมพ์
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={() =>
              window.open(
                window.URL.createObjectURL(
                  new Blob([content || ""], { type: "text/html" }),
                ),
                "_blank",
              )
            }
            disabled={!content}
            className="h-12 hidden sm:flex gap-2 rounded-2xl font-bold bg-slate-900 text-white shadow-xl shadow-slate-200"
          >
            <Maximize2 className="h-4 w-4" />
            เปิดหน้าต่างใหม่
          </Button>
        </div>
      }
    >
      <div className="flex-1 bg-slate-100 rounded-3xl overflow-auto p-4 sm:p-10 flex justify-center min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-slate-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-300" />
              </div>
            </div>
            <span className="text-sm font-black uppercase tracking-widest italic animate-pulse">กำลังดึงข้อมูลเอกสาร...</span>
          </div>
        ) : content ? (
          <div className="bg-white shadow-2xl min-h-full w-full max-w-[800px] rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-4 border-blue-500/20 rounded-xl z-10" />
            <iframe
              srcDoc={content}
              className="w-full h-full border-none min-h-[1100px] sm:min-h-full scale-[0.98] sm:scale-100 transition-transform origin-top"
              title="Document Preview"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
              <X className="h-10 w-10" />
            </div>
            <span className="font-bold">ไท่พบเนื้อหาในเอกสารนี้</span>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
