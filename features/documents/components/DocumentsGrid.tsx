"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Calendar, User, Download, Trash2, Eye } from "lucide-react";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteDocumentsAction } from "@/features/documents/bulk-actions";
import { toast } from "sonner";
import { VersionHistoryDialog } from "./VersionHistoryDialog";
import { ESignDialog } from "./ESignDialog";
import { AIDocumentInsight } from "./AIDocumentInsight";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DocumentWithRelations } from "../types";
import { DOC_TYPE_LABELS } from "../schema";

interface DocumentsGridProps {
  documents: DocumentWithRelations[];
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  } else if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

export function DocumentsGrid({ documents }: DocumentsGridProps) {
  const allIds = useMemo(() => documents?.map((d) => d.id) || [], [documents]);
  const {
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedCount,
    selectedIds,
  } = useTableSelection(allIds);

  const handleDelete = async (id: string, storagePath: string) => {
    const result = await bulkDeleteDocumentsAction([id]);
    if (result.success) {
      toast.success("ลบเอกสารสำเร็จ");
      window.location.reload();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteDocumentsAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      window.location.reload();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="เอกสาร"
      />

      {/* Select All Header */}
      {documents && documents.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={() => toggleSelectAll(allIds)}
            aria-label="เลือกทั้งหมด"
            className={
              isPartialSelected ? "data-[state=checked]:bg-primary/50" : ""
            }
          />
          <span className="text-sm text-slate-600">เลือกทั้งหมด</span>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <Card
              key={doc.id}
              className={`hover:shadow-lg hover:border-blue-200 transition-all ${
                isSelected(doc.id) ? "ring-2 ring-blue-500 border-blue-200" : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={isSelected(doc.id)}
                      onCheckedChange={() => toggleSelect(doc.id)}
                      aria-label={`เลือก ${doc.file_name}`}
                    />
                    <div className="h-12 w-12 bg-linear-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-200">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="font-semibold truncate text-slate-900"
                        title={doc.file_name}
                      >
                        {doc.file_name}
                      </div>
                      <div className="text-sm text-slate-500 font-medium">
                        {formatSize(doc.size_bytes || 0)}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {DOC_TYPE_LABELS[doc.document_type || ""] ||
                      doc.document_type}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {format(new Date(doc.created_at), "d MMM yyyy HH:mm", {
                      locale: th,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-xs">
                      {doc.owner_type === "PROPERTY" && doc.property?.title ? (
                        <>
                          ทรัพย์:{" "}
                          <span className="font-medium">
                            {doc.property.title}
                          </span>
                        </>
                      ) : doc.owner_type === "LEAD" && doc.lead ? (
                        <>
                          ลีด:{" "}
                          <span className="font-medium">
                            {doc.lead.full_name || doc.lead.email}
                          </span>
                        </>
                      ) : doc.owner_type === "DEAL" &&
                        doc.deal?.property?.title ? (
                        <>
                          ดีล:{" "}
                          <span className="font-medium">
                            {doc.deal.property.title}
                          </span>
                        </>
                      ) : doc.owner_type === "RENTAL_CONTRACT" &&
                        doc.rental_contract?.property?.title ? (
                        <>
                          สัญญา:{" "}
                          <span className="font-medium">
                            {doc.rental_contract.property.title}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">{doc.owner_type}</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 items-center justify-between">
                  <DocumentPreviewDialog
                    documentId={doc.id}
                    documentName={doc.file_name}
                    storagePath={doc.storage_path}
                    trigger={
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        ดูตัวอย่าง
                      </Button>
                    }
                  />
                  <VersionHistoryDialog
                    documentId={doc.id}
                    documentName={doc.file_name}
                    ownerId={doc.owner_id}
                    ownerType={doc.owner_type}
                  />
                  {doc.owner_type === "LEAD" && (
                    <>
                      <ESignDialog
                        documentId={doc.id}
                        documentName={doc.file_name}
                        currentStatus={doc.esign_status}
                        recipientEmail={doc.lead?.email}
                      />
                      <AIDocumentInsight
                        documentId={doc.id}
                        documentName={doc.file_name}
                        initialSummary={doc.ai_summary}
                        initialAnalysis={doc.ai_analysis}
                      />
                    </>
                  )}
                  <div className="flex gap-1 ml-auto">
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
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
            <FileText className="h-16 w-16 text-slate-300 mb-4" />
            <p className="font-medium text-lg">ยังไม่มีเอกสาร</p>
            <p className="text-sm">อัพโหลดเอกสารแรกของคุณเพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </div>
  );
}
