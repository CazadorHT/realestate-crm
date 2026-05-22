"use client";

import { useState, useEffect } from "react";
import { getDocumentVersionsAction, getDocumentSignedUrl } from "../actions";
import { DocumentUpload } from "./DocumentUpload";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  History,
  Download,
  Eye,
  Loader2,
  FileText,
  CheckCircle2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface VersionHistoryDialogProps {
  documentId: string;
  documentName: string;
  ownerId?: string; // Optional, needed for upload
  ownerType?: any; // Optional, needed for upload
  tenantId?: string | null;
  trigger?: React.ReactNode;
}

export function VersionHistoryDialog({
  documentId,
  documentName,
  ownerId,
  ownerType,
  tenantId,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <History className="h-4.5 w-4.5" />
          </Button>
        )
      }
      title={
        <div className="flex items-center justify-between w-full pr-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <History className="h-5 w-5" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">ประวัติเวอร์ชัน</span>
          </div>
          {ownerId && ownerType && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-xl border-indigo-100 text-indigo-600 font-bold bg-indigo-50/30 hover:bg-indigo-50 hidden sm:flex"
              onClick={() => setShowUpload(!showUpload)}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              อัปโหลดใหม่
            </Button>
          )}
        </div>
      }
      description={
        <div className="mt-1.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl max-w-fit">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">เอกสารต้นฉบับ</p>
          <p className="text-xs font-bold text-slate-700 truncate min-w-0">{documentName}</p>
        </div>
      }
    >
      <div className="py-2">
        {ownerId && ownerType && (
          <div className="sm:hidden mb-4">
            <Button
              variant="outline"
              className="w-full h-11 gap-2 rounded-xl border-indigo-100 text-indigo-600 font-bold bg-indigo-50/30"
              onClick={() => setShowUpload(!showUpload)}
            >
              <UploadCloud className="h-4 w-4" />
              อัปโหลดเวอร์ชันใหม่
            </Button>
          </div>
        )}

        {showUpload && ownerId && ownerType && (
          <div className="mb-8 p-5 border rounded-2xl bg-indigo-50/30 border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-300 relative">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">
                อัปโหลดไฟล์เวอร์ชันใหม่
              </h4>
              <button
                onClick={() => setShowUpload(false)}
                className="text-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DocumentUpload
              ownerId={ownerId}
              ownerType={ownerType}
              parentId={documentId}
              tenantId={tenantId}
              onUploadComplete={() => {
                setShowUpload(false);
                loadVersions();
                toast.success("อัปโหลดเวอร์ชันใหม่เรียบร้อยแล้ว");
              }}
            />
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 bg-indigo-500 rounded-full" />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400">กำลังโหลดประวัติ...</p>
          </div>
        ) : (
          <div className="relative space-y-5 px-1 py-2">
            {/* Timeline Line */}
            <div className="absolute left-[20px] top-4 bottom-4 w-1 bg-linear-to-b from-indigo-100 to-slate-50 rounded-full" />

            {versions.map((ver, idx) => (
              <div
                key={ver.id}
                className="relative flex items-start gap-5"
              >
                <div
                  className={`mt-1.5 h-10 w-10 rounded-2xl border-2 bg-white flex items-center justify-center z-10 shrink-0 shadow-sm transition-all ${
                    idx === 0 ? "border-indigo-600 scale-110 shadow-indigo-100" : "border-slate-200"
                  }`}
                >
                  {idx === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <span className="text-xs font-black text-slate-400">
                      {ver.version}
                    </span>
                  )}
                </div>

                <div
                  className={`flex-1 p-4 rounded-2xl border shadow-sm transition-all cursor-pointer hover:shadow-md ${
                    idx === 0
                      ? "bg-indigo-50/40 border-indigo-100 ring-2 ring-indigo-50/50"
                      : "bg-white border-slate-100"
                  }`}
                  onClick={() => handleView(ver.storage_path)}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${idx === 0 ? "text-indigo-900" : "text-slate-800"}`}>
                          Version {ver.version}
                        </span>
                        {idx === 0 && (
                          <span className="text-[9px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {format(
                          new Date(ver.created_at),
                          "d MMMM yyyy HH:mm",
                          { locale: th },
                        )}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl hover:bg-white text-slate-400 hover:text-indigo-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 bg-white/60 p-2 rounded-xl border border-slate-50/50">
                    <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate max-w-[200px] font-bold text-slate-600">{ver.file_name}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-tighter">{(ver.size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {versions.length === 0 && (
              <div className="text-center py-16 px-4">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400">ไม่พบประวัติเวอร์ชันของเอกสารนี้</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-3 rounded-xl bg-slate-50/50 border border-slate-100 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest italic">
          * เอกสารต้นฉบับจะถูกรวบรวมประวัติการแก้ไขไว้ที่นี่ทั้งหมด
        </div>
      </div>
    </ResponsiveDialog>
  );
}
