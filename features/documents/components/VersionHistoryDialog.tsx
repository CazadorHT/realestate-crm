"use client";

import { useState, useEffect } from "react";
import { getDocumentVersionsAction, getDocumentSignedUrl } from "../actions";
import { DocumentUpload } from "./DocumentUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  History,
  Download,
  Eye,
  Loader2,
  FileText,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface VersionHistoryDialogProps {
  documentId: string;
  documentName: string;
  ownerId?: string; // Optional, needed for upload
  ownerType?: any; // Optional, needed for upload
  trigger?: React.ReactNode;
}

export function VersionHistoryDialog({
  documentId,
  documentName,
  ownerId,
  ownerType,
  trigger,
}: VersionHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (open) {
      loadVersions();
    }
  }, [open, documentId]);

  async function loadVersions() {
    setLoading(true);
    try {
      const res = await getDocumentVersionsAction(documentId);
      if (res.success) {
        setVersions(res.data || []);
      } else {
        toast.error(res.message || "Failed to load version history");
      }
    } catch (err) {
      toast.error("An error occurred while loading versions");
    } finally {
      setLoading(false);
    }
  }

  const handleView = async (path: string) => {
    try {
      const url = await getDocumentSignedUrl(path);
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("Could not generate view link");
      }
    } catch (err) {
      toast.error("Error opening document");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500"
          >
            <History className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              ประวัติเวอร์ชัน
            </DialogTitle>
            {ownerId && ownerType && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setShowUpload(!showUpload)}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                อัปโหลดเวอร์ชันใหม่
              </Button>
            )}
          </div>
          <div className="mt-2 p-2 bg-slate-50 border rounded-md">
            <p className="text-xs font-semibold text-slate-700 truncate">
              {documentName}
            </p>
          </div>
        </DialogHeader>

        <div className="py-4">
          {showUpload && ownerId && ownerType && (
            <div className="mb-6 p-4 border rounded-lg bg-blue-50/30 border-blue-100 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  อัปโหลดไฟล์เวอร์ชันใหม่
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowUpload(false)}
                >
                  ×
                </Button>
              </div>
              <DocumentUpload
                ownerId={ownerId}
                ownerType={ownerType}
                parentId={documentId}
                onUploadComplete={() => {
                  setShowUpload(false);
                  loadVersions();
                  toast.success("อัปโหลดเวอร์ชันใหม่เรียบร้อยแล้ว");
                }}
              />
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm text-slate-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="relative space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {/* Timeline Line */}
              <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-slate-100" />

              {versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className="relative flex items-start gap-4 pl-2"
                >
                  <div
                    className={`mt-1 h-6 w-6 rounded-full border-2 bg-white flex items-center justify-center z-10 ${
                      idx === 0 ? "border-indigo-600" : "border-slate-300"
                    }`}
                  >
                    {idx === 0 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">
                        {ver.version}
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex-1 p-3 rounded-lg border shadow-sm transition-all ${
                      idx === 0
                        ? "bg-indigo-50/50 border-indigo-100 ring-1 ring-indigo-50"
                        : "bg-white border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <span
                          className={`text-sm font-bold ${idx === 0 ? "text-indigo-900" : "text-slate-800"}`}
                        >
                          Version {ver.version}{" "}
                          {idx === 0 && (
                            <span className="ml-2 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full uppercase">
                              Current
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {format(
                            new Date(ver.created_at),
                            "d MMMM yyyy HH:mm",
                            { locale: th },
                          )}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleView(ver.storage_path)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <FileText className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">
                        {ver.file_name}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>{(ver.size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
              ))}

              {versions.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">ไม่พบประวัติเวอร์ชัน</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-[10px] text-center text-slate-400 italic">
          *
          เอกสารที่มาจากการแก้ไขหรือสร้างใหม่โดยอิงจากต้นฉบับเดียวกันจะถูกรวบรวมไว้ที่นี่
        </div>
      </DialogContent>
    </Dialog>
  );
}
