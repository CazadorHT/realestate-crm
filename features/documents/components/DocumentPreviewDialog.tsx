"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Loader2, Maximize2, Download } from "lucide-react";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-7xl! h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="py-4 px-10 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-base font-medium truncate pr-4">
            ดูตัวอย่างเอกสาร: {documentName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              ดาวน์โหลด
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={!content}
              className="h-8 gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              พิมพ์
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  window.URL.createObjectURL(
                    new Blob([content || ""], { type: "text/html" }),
                  ),
                  "_blank",
                )
              }
              disabled={!content}
              className="h-8 gap-1.5"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              เต็มจอ
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-slate-100 overflow-auto p-4 md:p-8 flex justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>กำลังดึงข้อมูลเอกสาร...</span>
            </div>
          ) : content ? (
            <div className="bg-white shadow-xl min-h-full w-full max-w-[800px] rounded-sm relative">
              <iframe
                srcDoc={content}
                className="w-full h-full border-none min-h-[1100px]"
                title="Document Preview"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              ไม่พบเนื้อหาเอกสาร
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
