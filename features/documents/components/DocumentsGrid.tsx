"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Calendar,
  User,
  Download,
  Trash2,
  Eye,
  Search,
  X,
  CreditCard,
  Image as ImageIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DOC_TYPE_LABELS, DOC_OWNER_TYPE_LABELS } from "../schema";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const filteredDocuments = useMemo(() => {
    let result = documents;

    // Filter by type
    if (filterType === "SLIP") {
      result = result.filter((doc) => doc.document_type === "SLIP");
    } else if (filterType === "DOCUMENT") {
      result = result.filter((doc) => doc.document_type !== "SLIP");
    }

    if (!searchQuery.trim()) return result;
    const query = searchQuery.toLowerCase();
    return result.filter((doc) => {
      return (
        doc.file_name.toLowerCase().includes(query) ||
        doc.document_type?.toLowerCase().includes(query) ||
        doc.lead?.full_name?.toLowerCase().includes(query) ||
        doc.property?.title?.toLowerCase().includes(query)
      );
    });
  }, [documents, searchQuery]);

  const filteredIds = useMemo(
    () => filteredDocuments.map((d) => d.id),
    [filteredDocuments],
  );

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
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            รายการเอกสารทั้งหมด
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery
              ? `พบ ${filteredDocuments.length} รายการจากผลการค้นหา`
              : `แสดง ${documents.length} เอกสาร`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Button
              variant={filterType === "ALL" ? "white" : "ghost"}
              size="sm"
              className={`text-xs h-7 px-3 rounded-md transition-all ${filterType === "ALL" ? "shadow-sm" : "hover:bg-white/50"}`}
              onClick={() => setFilterType("ALL")}
            >
              ทั้งหมด
            </Button>
            <Button
              variant={filterType === "DOCUMENT" ? "white" : "ghost"}
              size="sm"
              className={`text-xs h-7 px-3 rounded-md transition-all ${filterType === "DOCUMENT" ? "shadow-sm" : "hover:bg-white/50"}`}
              onClick={() => setFilterType("DOCUMENT")}
            >
              เอกสาร
            </Button>
            <Button
              variant={filterType === "SLIP" ? "white" : "ghost"}
              size="sm"
              className={`text-xs h-7 px-3 rounded-md transition-all ${filterType === "SLIP" ? "shadow-sm" : "hover:bg-white/50"}`}
              onClick={() => setFilterType("SLIP")}
            >
              สลิป
            </Button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหาชื่อไฟล์, ประเภท หรือลูกค้า..."
              className="pl-10 pr-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        entityName="เอกสาร"
      />

      {/* Select All Header */}
      {filteredDocuments && filteredDocuments.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <Checkbox
            checked={isAllSelected && filteredDocuments.length > 0}
            onCheckedChange={() => toggleSelectAll(filteredIds)}
            aria-label="เลือกทั้งหมด"
            className={
              isPartialSelected ? "data-[state=checked]:bg-primary/50" : ""
            }
          />
          <span className="text-sm text-slate-600">เลือกทั้งหมด</span>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments && filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
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
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                        doc.document_type === "SLIP"
                          ? "bg-linear-to-br from-emerald-50 to-emerald-100 text-emerald-600 border-emerald-200"
                          : "bg-linear-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200"
                      }`}
                    >
                      {doc.document_type === "SLIP" ? (
                        <ImageIcon className="h-6 w-6" />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
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
                    className={`text-xs shrink-0 border shadow-xs ${
                      doc.document_type === "SLIP"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {DOC_TYPE_LABELS[doc.document_type?.toUpperCase() || ""] ||
                      doc.document_type ||
                      "อื่นๆ"}
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
                      <span className="text-slate-500 mr-1">
                        {DOC_OWNER_TYPE_LABELS[doc.owner_type] ||
                          doc.owner_type}
                        :
                      </span>
                      <span className="font-medium text-slate-700">
                        {doc.owner_type === "PROPERTY" ? (
                          doc.property?.title || "ไม่ระบุชื่อทรัพย์"
                        ) : doc.owner_type === "LEAD" ? (
                          doc.lead?.full_name ||
                          doc.lead?.email ||
                          "ไม่ระบุชื่อลูกค้า"
                        ) : doc.owner_type === "DEAL" ? (
                          doc.deal ? (
                            <>
                              {doc.deal.property?.title || "ไม่ระบุชื่อทรัพย์"}{" "}
                              {doc.deal.lead ? (
                                <span className="text-slate-400 font-normal">
                                  (
                                  {doc.deal.lead.full_name ||
                                    doc.deal.lead.email}
                                  )
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">
                                  (ไม่ระบุลูกค้า)
                                </span>
                              )}
                            </>
                          ) : (
                            "ไม่พบข้อมูลดีล"
                          )
                        ) : doc.owner_type === "RENTAL_CONTRACT" ? (
                          doc.rental_contract?.deal ? (
                            <>
                              {doc.rental_contract.deal.property?.title ||
                                "ไม่ระบุชื่อทรัพย์"}{" "}
                              {doc.rental_contract.deal.lead ? (
                                <span className="text-slate-400 font-normal">
                                  (
                                  {doc.rental_contract.deal.lead.full_name ||
                                    doc.rental_contract.deal.lead.email}
                                  )
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">
                                  (ไม่ระบุลูกค้า)
                                </span>
                              )}
                            </>
                          ) : (
                            "ไม่พบข้อมูลสัญญาเช่า"
                          )
                        ) : (
                          doc.owner_id
                        )}
                      </span>
                    </span>
                  </div>
                </div>

                <TooltipProvider delayDuration={0}>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 items-center justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <DocumentPreviewDialog
                            documentId={doc.id}
                            documentName={doc.file_name}
                            storagePath={doc.storage_path}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                ดูตัวอย่าง
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
                          <VersionHistoryDialog
                            documentId={doc.id}
                            documentName={doc.file_name}
                            ownerId={doc.owner_id}
                            ownerType={doc.owner_type}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>ประวัติเวอร์ชัน</TooltipContent>
                    </Tooltip>

                    {(doc.owner_type === "LEAD" ||
                      doc.owner_type === "DEAL" ||
                      doc.owner_type === "RENTAL_CONTRACT") && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <ESignDialog
                                documentId={doc.id}
                                documentName={doc.file_name}
                                currentStatus={doc.esign_status}
                                recipientEmail={
                                  doc.owner_type === "LEAD"
                                    ? doc.lead?.email
                                    : doc.owner_type === "DEAL"
                                      ? doc.deal?.lead?.email
                                      : doc.rental_contract?.deal?.lead?.email
                                }
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>ส่งเซ็น E-Signature</TooltipContent>
                        </Tooltip>

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
                      </>
                    )}
                    <div className="flex gap-1 ml-auto">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <ConfirmDialog
                              title="ลบเอกสาร"
                              description={`คุณแน่ใจหรือไม่ที่จะลบเอกสาร "${doc.file_name}"?`}
                              confirmText="ลบออก"
                              variant="destructive"
                              onConfirm={() =>
                                handleDelete(doc.id, doc.storage_path)
                              }
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
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
                  </div>
                </TooltipProvider>
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
