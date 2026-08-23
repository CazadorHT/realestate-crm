"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Calendar,
  Download,
  Trash2,
  Eye,
  Search,
  X,
  CreditCard,
  Image as ImageIcon,
  MoreVertical,
  History,
  PenTool,
  Sparkles,
  Loader2,
} from "lucide-react";
import { DocumentActions } from "./DocumentActions";
import { DocumentOwnerInfo } from "./DocumentOwnerInfo";
import { Input } from "@/components/ui/input";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteDocumentsAction } from "@/features/documents/bulk-actions";
import { toast } from "sonner";
import { AIDocumentInsight } from "./AIDocumentInsight";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DocumentWithRelations } from "../types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DOC_TYPE_LABELS, DOC_TYPE_LABELS_EN } from "../schema";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n/language-context";

interface DocumentsGridProps {
  documents: DocumentWithRelations[];
  tenantId?: string | null;
  totalCount: number;
  currentPage: number;
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

export function DocumentsGrid({
  documents,
  tenantId,
  totalCount,
  currentPage,
}: DocumentsGridProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const filterType = searchParams.get("type") || "ALL";

  // Sync debounced search to URL
  useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    if (currentQ === debouncedSearch) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    } else {
      params.delete("q");
    }
    params.set("page", "1"); // Reset to page 1 on search
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [debouncedSearch, pathname, router, searchParams]);

  const handleFilterChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type !== "ALL") {
      params.set("type", type);
    } else {
      params.delete("type");
    }
    params.set("page", "1"); // Reset
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

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

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleDelete = async (id: string, storagePath: string) => {
    const result = await bulkDeleteDocumentsAction([id]);
    if (result.success) {
      toast.success(isEn ? "Document deleted successfully" : "ลบเอกสารสำเร็จ");
      handleSuccessFeedback();
    } else {
      toast.error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
      throw new Error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeleteDocumentsAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      handleSuccessFeedback();
    } else {
      toast.error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
      throw new Error(result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"));
    }
  };

  const docTypeDict = isEn ? DOC_TYPE_LABELS_EN : DOC_TYPE_LABELS;

  return (
    <div className="space-y-4 relative">
      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl transition-all">
          <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-in zoom-in-95 duration-200">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-bold text-slate-700">
              {isEn ? "Loading documents..." : "กำลังโหลดข้อมูล..."}
            </span>
          </div>
        </div>
      )}

      {/* Search & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {isEn ? "All Documents" : "รายการเอกสารทั้งหมด"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery
              ? (isEn ? `Found ${totalCount} matching record(s)` : `พบผลการค้นหา ${totalCount} รายการ`)
              : (isEn ? `Found ${totalCount} document(s)` : `พบทั้งหมด ${totalCount} เอกสาร`)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-7 px-3 rounded-md transition-all cursor-pointer ${filterType === "ALL" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
              onClick={() => handleFilterChange("ALL")}
            >
              {isEn ? "All" : "ทั้งหมด"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-7 px-3 rounded-md transition-all cursor-pointer ${filterType === "DOCUMENT" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
              onClick={() => handleFilterChange("DOCUMENT")}
            >
              {isEn ? "Documents" : "เอกสาร"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-7 px-3 rounded-md transition-all cursor-pointer ${filterType === "SLIP" ? "bg-white shadow-sm" : "hover:bg-white/50"}`}
              onClick={() => handleFilterChange("SLIP")}
            >
              {isEn ? "Payment Slips" : "สลิป"}
            </Button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={isEn ? "Search file name..." : "ค้นหาชื่อไฟล์..."}
              className="pl-10 pr-10 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
        entityName={isEn ? "document(s)" : "เอกสาร"}
      />

      {/* Select All Header */}
      {documents && documents.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <Checkbox
            checked={isAllSelected && documents.length > 0}
            onCheckedChange={() => toggleSelectAll(allIds)}
            aria-label={isEn ? "Select all" : "เลือกทั้งหมด"}
            className={
              isPartialSelected ? "data-[state=checked]:bg-primary/50" : ""
            }
          />
          <span className="text-sm text-slate-600">
            {isEn ? "Select all" : "เลือกทั้งหมด"}
          </span>
        </div>
      )}

      {/* Desktop Table View (>= lg) */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-sm border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <th className="p-4 w-12 text-center">
                <Checkbox
                  checked={isAllSelected && documents.length > 0}
                  onCheckedChange={() => toggleSelectAll(allIds)}
                  aria-label={isEn ? "Select all" : "เลือกทั้งหมด"}
                />
              </th>
              <th className="p-4">{isEn ? "File Name" : "ชื่อไฟล์"}</th>
              <th className="p-4 w-40">{isEn ? "Document Type" : "ประเภทเอกสาร"}</th>
              <th className="p-4 w-48">{isEn ? "Created Date" : "วันที่สร้าง"}</th>
              <th className="p-4">{isEn ? "Reference" : "ข้อมูลอ้างอิง"}</th>
              <th className="p-4 w-44 text-right">{isEn ? "Actions" : "การจัดการ"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents && documents.length > 0 ? (
              documents.map((doc) => (
                <tr 
                  key={doc.id}
                  className={`hover:bg-slate-50/50 transition-colors ${
                    isSelected(doc.id) ? "bg-blue-50/30" : ""
                  }`}
                >
                  <td className="p-4 text-center">
                    <Checkbox
                      checked={isSelected(doc.id)}
                      onCheckedChange={() => toggleSelect(doc.id)}
                      aria-label={isEn ? `Select ${doc.file_name}` : `เลือก ${doc.file_name}`}
                    />
                  </td>
                  <td className="p-4 font-medium text-slate-900 lg:w-70">
                    <div className="flex items-center gap-3 ">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                          doc.document_type === "SLIP"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}
                      >
                        {doc.document_type === "SLIP" ? (
                          <ImageIcon className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 max-w-[280px]">
                        <div className="truncate font-semibold text-slate-800" title={doc.file_name}>
                          {doc.file_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {formatSize(doc.size_bytes || 0)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant="outline"
                      className={`text-xs border shadow-xs ${
                        doc.document_type === "SLIP"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {docTypeDict[doc.document_type?.toUpperCase() || ""] ||
                        doc.document_type ||
                        (isEn ? "Other" : "อื่นๆ")}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {format(new Date(doc.created_at), "d MMM yyyy HH:mm", {
                        locale: isEn ? enUS : th,
                      })}
                    </div>
                  </td>
                  <td className="p-4 max-w-sm!">
                    <DocumentOwnerInfo document={doc} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <DocumentPreviewDialog
                        documentId={doc.id}
                        documentName={doc.file_name}
                        storagePath={doc.storage_path}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 gap-1.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700! bg-white hover:bg-slate-50 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {isEn ? "Preview" : "ดูตัวอย่าง"}
                          </Button>
                        }
                      />
                      <DocumentActions document={doc} tenantId={tenantId} />
                      <ConfirmDialog
                        title={isEn ? "Delete Document" : "ลบเอกสาร"}
                        description={isEn ? `Are you sure you want to delete "${doc.file_name}"?` : `คุณแน่ใจหรือไม่ที่จะลบเอกสาร "${doc.file_name}"?`}
                        confirmText={isEn ? "Delete" : "ลบออก"}
                        cancelText={isEn ? "Cancel" : "ยกเลิก"}
                        variant="destructive"
                        onConfirm={() => handleDelete(doc.id, doc.storage_path)}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-500">
                    {isEn ? "No documents found" : "ไม่พบเอกสาร"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Grid View (< lg) */}
      <div className="lg:hidden grid gap-4 grid-cols-1 md:grid-cols-2">
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
                      aria-label={isEn ? `Select ${doc.file_name}` : `เลือก ${doc.file_name}`}
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
                    {docTypeDict[doc.document_type?.toUpperCase() || ""] ||
                      doc.document_type ||
                      (isEn ? "Other" : "อื่นๆ")}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {format(new Date(doc.created_at), "d MMM yyyy HH:mm", {
                      locale: isEn ? enUS : th,
                    })}
                  </div>
                  <DocumentOwnerInfo document={doc} />
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
                                className="gap-2 cursor-pointer"
                              >
                                <Eye className="h-4 w-4" />
                                {isEn ? "Preview" : "ดูตัวอย่าง"}
                              </Button>
                            }
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{isEn ? "View document preview" : "ดูพรีวิวเอกสาร"}</TooltipContent>
                    </Tooltip>

                    <div className="flex gap-1 ml-auto items-center">
                      <DocumentActions document={doc} tenantId={tenantId} />

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <ConfirmDialog
                              title={isEn ? "Delete Document" : "ลบเอกสาร"}
                              description={isEn ? `Are you sure you want to delete "${doc.file_name}"?` : `คุณแน่ใจหรือไม่ที่จะลบเอกสาร "${doc.file_name}"?`}
                              confirmText={isEn ? "Delete" : "ลบออก"}
                              cancelText={isEn ? "Cancel" : "ยกเลิก"}
                              variant="destructive"
                              onConfirm={() =>
                                handleDelete(doc.id, doc.storage_path)
                              }
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-red-600 text-white border-red-600">
                          {isEn ? "Delete document" : "ลบเอกสาร"}
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
            <p className="font-medium text-lg">{isEn ? "No documents found" : "ไม่พบเอกสาร"}</p>
            <p className="text-sm">{isEn ? "Try searching with different keywords or upload a new document" : "ลองค้นหาด้วยคำอื่น หรืออัพโหลดเอกสารใหม่"}</p>
          </div>
        )}
      </div>

      {/* Standardized Pagination Controls */}
      <div className="pt-6 border-t border-slate-100">
        <PaginationControls
          totalCount={totalCount}
          pageSize={50}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}

