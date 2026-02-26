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
import { FileText, Eye, Trash, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { VersionHistoryDialog } from "./VersionHistoryDialog";
import { ESignDialog } from "./ESignDialog";
import { AIDocumentInsight } from "./AIDocumentInsight";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
}

export function DocumentList({
  ownerId,
  ownerType,
  refreshTrigger,
}: DocumentListProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    setLoading(true);
    const res = await deleteDocumentAction(id, storagePath);
    if (res.success) {
      toast.success("ลบไฟล์สำเร็จ");
      fetchDocs();
    } else {
      toast.error("ลบไฟล์ไม่สำเร็จ");
      setLoading(false);
    }
    setDeletingId(null);
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
    <div className="space-y-3">
      {documents.map((doc) => (
        <Card key={doc.id} className="overflow-hidden">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-sm truncate max-w-[400px]">
                  {doc.file_name}
                </div>
                <div className="text-xs text-muted-foreground flex gap-2">
                  <span>
                    {DOC_TYPE_LABELS[doc.document_type?.toUpperCase()] ||
                      doc.document_type ||
                      "อื่นๆ"}
                  </span>
                  <span>•</span>
                  <span>
                    {format(new Date(doc.created_at), "d MMM yy", {
                      locale: th,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <TooltipProvider delayDuration={0}>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <VersionHistoryDialog
                        documentId={doc.id}
                        documentName={doc.file_name}
                        ownerId={ownerId}
                        ownerType={ownerType}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>ประวัติเวอร์ชัน</TooltipContent>
                </Tooltip>

                {ownerType === "LEAD" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ESignDialog
                          documentId={doc.id}
                          documentName={doc.file_name}
                          currentStatus={doc.esign_status}
                          recipientEmail={doc.lead?.email || (doc as any).email}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>ส่งเซ็น E-Signature</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <AIDocumentInsight
                        documentId={doc.id}
                        documentName={doc.file_name}
                        initialSummary={doc.ai_summary}
                        initialAnalysis={doc.ai_analysis}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>วิเคราะห์ด้วย AI</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DocumentPreviewDialog
                        documentId={doc.id}
                        documentName={doc.file_name}
                        storagePath={doc.storage_path}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>ดูพรีวิวเอกสาร</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ConfirmDialog
                        title="ลบเอกสาร"
                        description={`คุณแน่ใจหรือไม่ที่จะลบเอกสาร "${doc.file_name}"?`}
                        confirmText="ลบออก"
                        variant="destructive"
                        onConfirm={() => handleDelete(doc.id, doc.storage_path)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-red-600 text-white border-red-600 fill-red-600">
                    ลบเอกสาร
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
