"use client";

import { useMemo, useState, useEffect, useTransition, Fragment } from "react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Calendar,
  Trash2,
  Eye,
  Search,
  X,
  Image as ImageIcon,
  Loader2,
  ChevronDown,
  ChevronRight,
  Layers,
  List,
  FolderClosed,
  FolderOpen,
} from "lucide-react";
import { DocumentActions } from "./DocumentActions";
import { DocumentOwnerInfo } from "./DocumentOwnerInfo";
import { Input } from "@/components/ui/input";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeleteDocumentsAction } from "@/features/documents/bulk-actions";
import { toast } from "sonner";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
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
import { useLanguage } from "@/lib/i18n/language-context";

interface DocumentsGridProps {
  documents: DocumentWithRelations[];
  tenantId?: string | null;
  totalCount: number;
  currentPage: number;
}

interface DocumentGroup {
  key: string;
  ownerType: string;
  ownerId: string;
  representativeDoc: DocumentWithRelations;
  documents: DocumentWithRelations[];
  totalSize: number;
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
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");

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

  // Group documents by reference
  const groups: DocumentGroup[] = useMemo(() => {
    if (!documents || documents.length === 0) return [];
    const map = new Map<string, DocumentGroup>();

    for (const doc of documents) {
      const key = `${doc.owner_type || "OTHER"}_${doc.owner_id || "NONE"}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          ownerType: doc.owner_type || "OTHER",
          ownerId: doc.owner_id || "NONE",
          representativeDoc: doc,
          documents: [],
          totalSize: 0,
        });
      }
      const grp = map.get(key)!;
      grp.documents.push(doc);
      grp.totalSize += doc.size_bytes || 0;
    }

    return Array.from(map.values());
  }, [documents]);

  // Expanded groups state (default: all expanded)
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(() => {
    return new Set(groups.map((g) => g.key));
  });

  // Keep expanded state up to date when documents load
  useEffect(() => {
    setExpandedGroupKeys((prev) => {
      const next = new Set(prev);
      groups.forEach((g) => next.add(g.key));
      return next;
    });
  }, [groups]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroupKeys(new Set(groups.map((g) => g.key)));
  };

  const collapseAll = () => {
    setExpandedGroupKeys(new Set());
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

  const isGroupSelected = (grp: DocumentGroup) => {
    return (
      grp.documents.length > 0 &&
      grp.documents.every((d) => isSelected(d.id))
    );
  };

  const isGroupPartialSelected = (grp: DocumentGroup) => {
    const selectedInGroup = grp.documents.filter((d) => isSelected(d.id)).length;
    return selectedInGroup > 0 && selectedInGroup < grp.documents.length;
  };

  const toggleGroupSelect = (grp: DocumentGroup) => {
    const allSelected = isGroupSelected(grp);
    grp.documents.forEach((d) => {
      if (allSelected) {
        if (isSelected(d.id)) toggleSelect(d.id);
      } else {
        if (!isSelected(d.id)) toggleSelect(d.id);
      }
    });
  };

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
      toast.error(
        result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"),
      );
      throw new Error(
        result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"),
      );
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
      toast.error(
        result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"),
      );
      throw new Error(
        result.message || (isEn ? "An error occurred" : "เกิดข้อผิดพลาด"),
      );
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

      {/* Search & Toolbar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {isEn ? "All Documents" : "รายการเอกสารทั้งหมด"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery
              ? isEn
                ? `Found ${totalCount} matching record(s)`
                : `พบผลการค้นหา ${totalCount} รายการ`
              : isEn
                ? `Found ${totalCount} document(s)`
                : `พบทั้งหมด ${totalCount} เอกสาร`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-7.5 px-3 gap-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grouped"
                  ? "bg-white shadow-sm font-bold text-indigo-600"
                  : "text-slate-600 hover:bg-white/50"
              }`}
              onClick={() => setViewMode("grouped")}
              title={
                isEn
                  ? "Group files by Deal/Reference"
                  : "จัดกลุ่มไฟล์ตามดีล/รายการอ้างอิง"
              }
            >
              <Layers className="h-3.5 w-3.5" />
              {isEn ? "Grouped" : "จัดกลุ่มดีล"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-7.5 px-3 gap-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "flat"
                  ? "bg-white shadow-sm font-bold text-indigo-600"
                  : "text-slate-600 hover:bg-white/50"
              }`}
              onClick={() => setViewMode("flat")}
              title={
                isEn ? "Show all files as flat list" : "แสดงแยกไฟล์ทั้งหมด"
              }
            >
              <List className="h-3.5 w-3.5" />
              {isEn ? "Flat List" : "รายไฟล์"}
            </Button>
          </div>

          {/* Group Expand / Collapse Buttons */}
          {viewMode === "grouped" && groups.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-0.5 rounded-xl">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7.5 px-2.5 text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer rounded-lg"
                onClick={expandAll}
              >
                {isEn ? "Expand All" : "ขยายทั้งหมด"}
              </Button>
              <span className="text-slate-300">|</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7.5 px-2.5 text-slate-600 hover:text-indigo-600 font-semibold cursor-pointer rounded-lg"
                onClick={collapseAll}
              >
                {isEn ? "Collapse All" : "ย่อทั้งหมด"}
              </Button>
            </div>
          )}

          {/* Type Filters */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-7.5 px-3 rounded-lg transition-all cursor-pointer ${filterType === "ALL" ? "bg-white shadow-sm font-bold text-slate-800" : "text-slate-600 hover:bg-white/50"}`}
              onClick={() => handleFilterChange("ALL")}
            >
              {isEn ? "All" : "ทั้งหมด"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-7.5 px-3 rounded-lg transition-all cursor-pointer ${filterType === "DOCUMENT" ? "bg-white shadow-sm font-bold text-slate-800" : "text-slate-600 hover:bg-white/50"}`}
              onClick={() => handleFilterChange("DOCUMENT")}
            >
              {isEn ? "Documents" : "เอกสาร"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`text-xs h-7.5 px-3 rounded-lg transition-all cursor-pointer ${filterType === "SLIP" ? "bg-white shadow-sm font-bold text-slate-800" : "text-slate-600 hover:bg-white/50"}`}
              onClick={() => handleFilterChange("SLIP")}
            >
              {isEn ? "Payment Slips" : "สลิป"}
            </Button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={isEn ? "Search file name..." : "ค้นหาชื่อไฟล์..."}
              className="pl-10 pr-10 bg-white rounded-xl"
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

      {/* Desktop Table View (>= lg) */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-sm border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold">
              <th className="p-4 w-12 text-center">
                <Checkbox
                  checked={isAllSelected && documents.length > 0}
                  onCheckedChange={() => toggleSelectAll(allIds)}
                  aria-label={isEn ? "Select all" : "เลือกทั้งหมด"}
                  className={
                    isPartialSelected ? "data-[state=checked]:bg-primary/50" : ""
                  }
                />
              </th>
              <th className="p-4">{isEn ? "File Name" : "ชื่อไฟล์"}</th>
              <th className="p-4 w-44">{isEn ? "Document Type" : "ประเภทเอกสาร"}</th>
              <th className="p-4 w-48">{isEn ? "Created Date" : "วันที่สร้าง"}</th>
              {viewMode === "flat" && (
                <th className="p-4 min-w-[260px]">{isEn ? "Reference" : "ข้อมูลอ้างอิง"}</th>
              )}
              <th className="p-4 w-44 text-right">{isEn ? "Actions" : "การจัดการ"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents && documents.length > 0 ? (
              viewMode === "grouped" ? (
                /* 📂 GROUPED VIEW ACCORDION */
                groups.map((grp) => {
                  const isExpanded = expandedGroupKeys.has(grp.key);
                  return (
                    <Fragment key={grp.key}>
                      {/* Group Header Row */}
                      <tr
                        className="bg-linear-to-r from-indigo-50/70 via-slate-50/60 to-indigo-50/30 hover:from-indigo-100/60 hover:to-indigo-50/50 transition-colors border-t border-b border-indigo-100/80 cursor-pointer select-none"
                        onClick={() => toggleGroup(grp.key)}
                      >
                        <td
                          className="p-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isGroupSelected(grp)}
                            onCheckedChange={() => toggleGroupSelect(grp)}
                            className={
                              isGroupPartialSelected(grp)
                                ? "data-[state=checked]:bg-primary/50"
                                : ""
                            }
                            aria-label={
                              isEn ? "Select group" : "เลือกทั้งกลุ่ม"
                            }
                          />
                        </td>
                        <td colSpan={4} className="p-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <button
                                type="button"
                                className="h-8 w-8 rounded-xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-all shadow-xs shrink-0 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleGroup(grp.key);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4.5 w-4.5 transition-transform" />
                                ) : (
                                  <ChevronRight className="h-4.5 w-4.5 transition-transform" />
                                )}
                              </button>
                              <div className="min-w-0">
                                <DocumentOwnerInfo
                                  document={grp.representativeDoc}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 pr-3">
                              <Badge
                                variant="outline"
                                className="bg-white text-indigo-700 border-indigo-200 font-bold text-xs gap-1.5 px-3 py-1 rounded-xl shadow-xs"
                              >
                                {isExpanded ? (
                                  <FolderOpen className="h-3.5 w-3.5 text-indigo-500" />
                                ) : (
                                  <FolderClosed className="h-3.5 w-3.5 text-indigo-500" />
                                )}
                                {grp.documents.length}{" "}
                                {isEn
                                  ? grp.documents.length > 1
                                    ? "files"
                                    : "file"
                                  : "ไฟล์"}
                              </Badge>
                              <span className="text-xs font-bold text-slate-500">
                                {formatSize(grp.totalSize)}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Child Document Rows under this Group */}
                      {isExpanded &&
                        grp.documents.map((doc) => (
                          <tr
                            key={doc.id}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              isSelected(doc.id)
                                ? "bg-blue-50/30"
                                : "bg-white"
                            }`}
                          >
                            <td className="p-4 text-center">
                              <Checkbox
                                checked={isSelected(doc.id)}
                                onCheckedChange={() => toggleSelect(doc.id)}
                                aria-label={
                                  isEn
                                    ? `Select ${doc.file_name}`
                                    : `เลือก ${doc.file_name}`
                                }
                              />
                            </td>
                            <td className="p-4 font-medium text-slate-900">
                              <div className="flex items-center gap-3 pl-4 relative">
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 border-l-2 border-b-2 border-indigo-200 rounded-bl-md" />
                                <div
                                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
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
                                <div className="min-w-0">
                                  <div
                                    className="truncate font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                                    title={doc.file_name}
                                  >
                                    {doc.file_name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
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
                                {docTypeDict[
                                  doc.document_type?.toUpperCase() || ""
                                ] ||
                                  doc.document_type ||
                                  (isEn ? "Other" : "อื่นๆ")}
                              </Badge>
                            </td>
                            <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                {format(
                                  new Date(doc.created_at),
                                  "d MMM yyyy HH:mm",
                                  {
                                    locale: isEn ? enUS : th,
                                  },
                                )}
                              </div>
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
                                <DocumentActions
                                  document={doc}
                                  tenantId={tenantId}
                                />
                                <ConfirmDialog
                                  title={isEn ? "Delete Document" : "ลบเอกสาร"}
                                  description={
                                    isEn
                                      ? `Are you sure you want to delete "${doc.file_name}"?`
                                      : `คุณแน่ใจหรือไม่ที่จะลบเอกสาร "${doc.file_name}"?`
                                  }
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
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 rounded-lg cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })
              ) : (
                /* 📄 FLAT LIST VIEW */
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
                        aria-label={
                          isEn
                            ? `Select ${doc.file_name}`
                            : `เลือก ${doc.file_name}`
                        }
                      />
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
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
                        <div className="min-w-0">
                          <div
                            className="truncate font-bold text-slate-800"
                            title={doc.file_name}
                          >
                            {doc.file_name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
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
                        {docTypeDict[
                          doc.document_type?.toUpperCase() || ""
                        ] ||
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
                    <td className="p-4 min-w-[260px]">
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
                          description={
                            isEn
                              ? `Are you sure you want to delete "${doc.file_name}"?`
                              : `คุณแน่ใจหรือไม่ที่จะลบเอกสาร "${doc.file_name}"?`
                          }
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
              )
            ) : (
              <tr>
                <td
                  colSpan={viewMode === "grouped" ? 5 : 6}
                  className="text-center py-16 text-slate-400"
                >
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
      <div className="lg:hidden space-y-4">
        {documents && documents.length > 0 ? (
          viewMode === "grouped" ? (
            groups.map((grp) => {
              const isExpanded = expandedGroupKeys.has(grp.key);
              return (
                <Card
                  key={grp.key}
                  className="border border-slate-200 overflow-hidden shadow-xs"
                >
                  {/* Mobile Group Header */}
                  <div
                    className="p-4 bg-linear-to-r from-indigo-50/70 via-slate-50/60 to-indigo-50/30 border-b border-slate-100 flex items-center justify-between gap-3 cursor-pointer select-none"
                    onClick={() => toggleGroup(grp.key)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 cursor-pointer shadow-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(grp.key);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4.5 w-4.5 text-indigo-600" />
                        ) : (
                          <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <DocumentOwnerInfo
                          document={grp.representativeDoc}
                        />
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-white text-indigo-700 border-indigo-200 font-bold text-xs shrink-0 shadow-xs"
                    >
                      {grp.documents.length} {isEn ? "files" : "ไฟล์"}
                    </Badge>
                  </div>

                  {/* Mobile Child Document List */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100 bg-white">
                      {grp.documents.map((doc) => (
                        <div key={doc.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Checkbox
                                checked={isSelected(doc.id)}
                                onCheckedChange={() => toggleSelect(doc.id)}
                                aria-label={
                                  isEn
                                    ? `Select ${doc.file_name}`
                                    : `เลือก ${doc.file_name}`
                                }
                              />
                              <div
                                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                  doc.document_type === "SLIP"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : "bg-blue-50 text-blue-600 border-blue-200"
                                }`}
                              >
                                {doc.document_type === "SLIP" ? (
                                  <ImageIcon className="h-5 w-5" />
                                ) : (
                                  <FileText className="h-5 w-5" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div
                                  className="font-bold truncate text-slate-900 text-sm"
                                  title={doc.file_name}
                                >
                                  {doc.file_name}
                                </div>
                                <div className="text-xs text-slate-400 font-medium">
                                  {formatSize(doc.size_bytes || 0)}
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ${
                                doc.document_type === "SLIP"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {docTypeDict[
                                doc.document_type?.toUpperCase() || ""
                              ] || doc.document_type}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {format(
                                new Date(doc.created_at),
                                "d MMM yyyy HH:mm",
                                {
                                  locale: isEn ? enUS : th,
                                },
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <DocumentPreviewDialog
                                documentId={doc.id}
                                documentName={doc.file_name}
                                storagePath={doc.storage_path}
                                trigger={
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    {isEn ? "Preview" : "ดูตัวอย่าง"}
                                  </Button>
                                }
                              />
                              <DocumentActions
                                document={doc}
                                tenantId={tenantId}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className={`hover:shadow-lg hover:border-blue-200 transition-all ${
                    isSelected(doc.id)
                      ? "ring-2 ring-blue-500 border-blue-200"
                      : ""
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={isSelected(doc.id)}
                          onCheckedChange={() => toggleSelect(doc.id)}
                          aria-label={
                            isEn
                              ? `Select ${doc.file_name}`
                              : `เลือก ${doc.file_name}`
                          }
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
                            className="font-bold truncate text-slate-900"
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
                        {docTypeDict[
                          doc.document_type?.toUpperCase() || ""
                        ] ||
                          doc.document_type ||
                          (isEn ? "Other" : "อื่นๆ")}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {format(
                          new Date(doc.created_at),
                          "d MMM yyyy HH:mm",
                          {
                            locale: isEn ? enUS : th,
                          },
                        )}
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
                          <TooltipContent>
                            {isEn
                              ? "View document preview"
                              : "ดูพรีวิวเอกสาร"}
                          </TooltipContent>
                        </Tooltip>

                        <div className="flex gap-1 ml-auto items-center">
                          <DocumentActions
                            document={doc}
                            tenantId={tenantId}
                          />

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <ConfirmDialog
                                  title={
                                    isEn ? "Delete Document" : "ลบเอกสาร"
                                  }
                                  description={
                                    isEn
                                      ? `Are you sure you want to delete "${doc.file_name}"?`
                                      : `คุณแน่ใจหรือไม่ที่จะลบเอกสาร "${doc.file_name}"?`
                                  }
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
              ))}
            </div>
          )
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
            <FileText className="h-16 w-16 text-slate-300 mb-4" />
            <p className="font-medium text-lg">
              {isEn ? "No documents found" : "ไม่พบเอกสาร"}
            </p>
            <p className="text-sm">
              {isEn
                ? "Try searching with different keywords or upload a new document"
                : "ลองค้นหาด้วยคำอื่น หรืออัพโหลดเอกสารใหม่"}
            </p>
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
