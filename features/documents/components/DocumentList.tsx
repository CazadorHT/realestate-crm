"use client";

import { useState, useEffect } from "react";
import { DocumentOwnerType, DocumentType, DOC_TYPE_LABELS } from "../schema";
import {
  getDocumentsByOwner,
  getDocumentSignedUrl,
  deleteDocumentAction,
} from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Eye,
  Trash,
  Loader2,
  History,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { VersionHistoryDialog } from "./VersionHistoryDialog";
import { ESignDialog } from "./ESignDialog";
import { AIDocumentInsight } from "./AIDocumentInsight";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentListProps {
  ownerId: string;
  ownerType: DocumentOwnerType;
  refreshTrigger?: number; // Simple prop to trigger refetch
  tenantId?: string | null;
}

export function DocumentList({
  ownerId,
  ownerType,
  refreshTrigger,
  tenantId,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    const docs = await getDocumentsByOwner(ownerId, ownerType);
    setDocuments(docs || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, [ownerId, ownerType, refreshTrigger]);

  const handleView = async (storagePath: string) => {
    const url = await getDocumentSignedUrl(storagePath);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("ไม่สามารถเปิดไฟล์ได้");
    }
  };

  const handleDelete = async (id: string, storagePath: string) => {
    const res = await deleteDocumentAction(id, storagePath);
    if (res.success) {
      toast.success("ลบไฟล์สำเร็จ");
      fetchDocs();
    } else {
      toast.error("ลบไฟล์ไม่สำเร็จ");
      throw new Error("ลบไฟล์ไม่สำเร็จ");
    }
  };

  if (loading)
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Loader2 className="animate-spin h-5 w-5 mx-auto" />
      </div>
    );

  if (documents.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
        ยังไม่มีเอกสาร
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4  scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300 transition-colors">
      {documents.map((doc, index) => (  
        <Card
          key={doc.id}
          className="group overflow-hidden border-none rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300"
        >
          <CardContent className="p-0 flex flex-row h-full min-h-[80px]">
            {/* 📁 Sidebar: Document Icon (Mini) */}
            <div className="relative w-14 md:w-20 shrink-0 overflow-hidden bg-slate-50 border-r border-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors duration-300">
              <div className="relative">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-slate-300 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-500" />
                <div className="absolute md:-top-1.5 md:-right-2 h-3 px-1 rounded-sm bg-white border border-slate-200 text-[7px] font-black text-slate-500 flex items-center justify-center uppercase shadow-xs">
                  {doc.file_name.split(".").pop() || "DOC"}
                </div>
              </div>

              {/* Status Badge Overlay */}
            </div>

            {/* 📝 Content Section */}
            <div className="flex-1 p-3 flex items-center justify-between gap-2 md:gap-4 min-w-0">
              <div className="flex flex-col gap-0.5 md:gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                  <span className="text-[10px] md:text-xs font-semibold text-blue-600 uppercase tracking-widest leading-none bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-100/50">
                    {DOC_TYPE_LABELS[doc.document_type?.toUpperCase()] || doc.document_type || "อื่นๆ"}
                  </span>

                  {doc.esign_status && (
                    <Badge
                      className={cn(
                        "text-[10px] md:text-xs font-semibold uppercase px-1.5 py-0.5 rounded-sm shadow-xs border border-white/10",
                        doc.esign_status === "SIGNED"
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-500 text-white",
                      )}
                    >
                      {doc.esign_status === "SIGNED" ? "เซ็นแล้ว" : "รอดำเนินการ"}
                    </Badge>
                  )}

                  {doc.ai_summary && (
                    <span className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-purple-600 uppercase tracking-widest leading-none bg-purple-50 px-1.5 py-0.5 rounded-sm border border-purple-100/50">
                      <div className="h-1 w-1 bg-purple-400 rounded-full animate-pulse" />
                      AI ANALYZED
                    </span>
                  )}
                </div>

                <div
                  className="font-bold text-xs md:text-sm text-slate-700 group-hover:text-blue-600 transition-colors truncate pr-2 md:pr-4"
                  title={doc.file_name}
                >
                  {doc.file_name}
                </div>

                <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] text-slate-400 font-medium leading-none">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3 opacity-50" />
                    {format(new Date(doc.created_at), "d MMM yy", {
                      locale: th,
                    })}
                  </div>
                  {doc.version > 1 && (
                    <div className="flex items-center gap-1 text-blue-500 font-bold">
                      <History className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      v{doc.version}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Menu (Integrated) */}
              <div className="shrink-0 flex items-center gap-1">
                <ResponsiveDialog
                  title="จัดการเอกสาร"
                  description="เลือกคำสั่งสำหรับเอกสารนี้"
                  className="bg-white md:max-w-[640px]"
                  shouldScaleBackground={false}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 active:scale-95 bg-white shadow-xs"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                >
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <DocumentPreviewDialog
                        documentId={doc.id}
                        documentName={doc.file_name}
                        storagePath={doc.storage_path}
                        trigger={
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100"
                          >
                            <div className="h-8 w-8 rounded-lg bg-blue-100/50 flex items-center justify-center">
                              <Eye className="h-4 w-4" />
                            </div>
                            ดูตัวอย่างเอกสาร
                          </Button>
                        }
                      />

                      <VersionHistoryDialog
                        documentId={doc.id}
                        documentName={doc.file_name}
                        ownerId={ownerId}
                        ownerType={ownerType}
                        trigger={
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100"
                          >
                            <div className="h-8 w-8 rounded-lg bg-slate-100/80 flex items-center justify-center">
                              <History className="h-4 w-4" />
                            </div>
                            ประวัติเวอร์ชัน
                          </Button>
                        }
                      />

                      {ownerType === "LEAD" && (
                        <ESignDialog
                          documentId={doc.id}
                          documentName={doc.file_name}
                          currentStatus={doc.esign_status}
                          trigger={
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 border border-transparent hover:border-amber-100"
                            >
                              <div className="h-8 w-8 rounded-lg bg-amber-100/50 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-amber-500 rounded-sm" />
                              </div>
                              ส่งเซ็น E-Signature
                            </Button>
                          }
                        />
                      )}

                      <AIDocumentInsight
                        documentId={doc.id}
                        documentName={doc.file_name}
                        initialSummary={doc.ai_summary}
                        initialAnalysis={doc.ai_analysis}
                        trigger={
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-600 border border-transparent hover:border-purple-100"
                          >
                            <div className="h-8 w-8 rounded-lg bg-purple-100/50 flex items-center justify-center">
                              <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse" />
                            </div>
                            วิเคราะห์ด้วย AI
                          </Button>
                        }
                      />
                    </div>

                    <div className="h-px bg-slate-100" />

                    <ConfirmDialog
                      title="ลบเอกสาร"
                      description={`คุณแน่ใจหรือไม่ที่จะลบเอกสาร "${doc.file_name}"?`}
                      confirmText="ลบออกถาวร"
                      variant="destructive"
                      onConfirm={() => handleDelete(doc.id, doc.storage_path)}
                      trigger={
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 rounded-xl px-4 gap-3 font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-100 group"
                        >
                          <div className="h-8 w-8 rounded-lg bg-rose-100/50 flex items-center justify-center group-hover:bg-rose-100">
                            <Trash className="h-4 w-4" />
                          </div>
                          ลบเอกสารนี้
                        </Button>
                      }
                    />
                  </div>
                </ResponsiveDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
