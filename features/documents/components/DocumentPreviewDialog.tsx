"use client";

import { useState, useEffect, useCallback } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Eye, Printer, Loader2, Maximize2, Download, FileText, X } from "lucide-react";
import { downloadDocumentAction, getDocumentSignedUrl } from "../actions";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/language-context";

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
  const { language } = useLanguage();
  const isEn = language === "en";

  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isImage =
    storagePath.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/) ||
    documentName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg)$/);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      if (isImage) {
        const url = await getDocumentSignedUrl(storagePath);
        if (url) {
          setImageUrl(url);
          setContent("IMAGE");
        } else {
          toast.error(isEn ? "Unable to download image" : "ไม่สามารถดาวน์โหลดภาพสลิปได้");
        }
      } else {
        const res = await downloadDocumentAction(storagePath);
        if (res.success && res.data) {
          setContent(res.data);
        } else {
          toast.error(res.message || (isEn ? "Unable to load document content" : "ไม่สามารถโหลดเนื้อหาเอกสารได้"));
        }
      }
    } catch (err) {
      toast.error(isEn ? "An error occurred while loading the document" : "เกิดข้อผิดพลาดในการโหลดเอกสาร");
    } finally {
      setLoading(false);
    }
  }, [storagePath, isImage, isEn]);

  useEffect(() => {
    if (open && !content) {
      loadContent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      if (isImage && imageUrl) {
        printWindow.document.write(`<div style="display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${imageUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" /></div>`);
      } else if (content) {
        printWindow.document.write(content);
      }
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 800);
    }
  };

  const handleDownload = async () => {
    const url = isImage ? imageUrl : await getDocumentSignedUrl(storagePath);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error(isEn ? "Unable to download file" : "ไม่สามารถดาวน์โหลดไฟล์ได้");
    }
  };

  const handleDownloadWord = async () => {
    if (!content || isImage) return;

    if (storagePath.toLowerCase().endsWith(".docx") || storagePath.toLowerCase().endsWith(".doc")) {
      handleDownload();
      return;
    }

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><title>Document</title><meta charset='utf-8'></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;

    const blob = new Blob(['\ufeff' + sourceHTML], {
      type: "application/vnd.ms-word"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = documentName.replace(/\.[^/.]+$/, "") + ".doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenFullPage = () => {
    if (isImage && imageUrl) {
      window.open(imageUrl, "_blank");
    } else if (content) {
      const blob = new Blob([content], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      className="sm:max-w-[95vw]! md:max-w-[90vw]! lg:max-w-[1200px]! h-[98vh] flex flex-col overflow-hidden"
      trigger={
        trigger || (
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <Eye className="h-4.5 w-4.5" />
          </Button>
        )
      }
      title={
        <div className="flex items-center gap-3 w-full pr-12">
          <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl text-indigo-600 shrink-0 shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-black text-slate-900 tracking-tight truncate leading-tight">
              {isEn ? "Document" : "เอกสาร"}
            </span>
            <span className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5 tracking-wider">{documentName}</span>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full shrink-0 bg-gradient-to-r from-slate-50 to-white">
          {/* Download Actions */}
          <Button
            variant="default"
            size="lg"
            onClick={handlePrint}
            disabled={!content}
            className="h-11 flex-1 sm:flex-none gap-2 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">{isEn ? "Download PDF / Print" : "ดาวน์โหลด PDF / พิมพ์"}</span>
            <span className="sm:hidden">{isEn ? "PDF / Print" : "PDF / พิมพ์"}</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleDownloadWord}
            disabled={!content}
            className="h-11 flex-1 sm:flex-none gap-2 rounded-2xl border-slate-200 font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="hidden sm:inline">{isEn ? "Download Word (.doc)" : "ดาวน์โหลด Word (.doc)"}</span>
            <span className="sm:hidden">Word</span>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleDownload}
            className="h-11 gap-2 rounded-2xl border-transparent font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">HTML</span>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={handleOpenFullPage}
            disabled={!content}
            className="h-11 gap-2 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-auto transition-all hidden sm:flex cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" />
            {isEn ? "Full Screen" : "เปิดเต็มจอ"}
          </Button>
        </div>
      }
    >
      <div className="flex-1 bg-gradient-to-b from-slate-100 to-slate-50 rounded-2xl overflow-auto flex justify-center min-h-[500px] p-2 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-slate-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-300" />
              </div>
            </div>
            <span className="text-sm font-black uppercase tracking-widest italic animate-pulse">
              {isEn ? "Retrieving document content..." : "กำลังดึงข้อมูลเอกสาร..."}
            </span>
          </div>
        ) : content ? (
          <div className="bg-white shadow-2xl shadow-slate-200/50 w-full max-w-[850px] rounded-xl relative overflow-hidden ring-1 ring-slate-200/50 flex justify-center items-center p-4">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl || ""}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                alt={documentName}
              />
            ) : (
              <iframe
                srcDoc={content}
                className="w-full border-none"
                title="Document Preview"
                style={{ minHeight: "1200px", height: "100%" }}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
              <X className="h-10 w-10" />
            </div>
            <span className="font-bold">{isEn ? "No content found in this document" : "ไม่พบเนื้อหาในเอกสารนี้"}</span>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}

