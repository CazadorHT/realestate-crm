"use client";

import React, { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  Edit3,
  MapPin,
  Facebook,
  Instagram,
  MessageCircle,
  Music2,
  Copy,
  Clock,
  Users,
  ImageIcon,
  AlertTriangle,
  Building2,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { PropertyStatusBadge } from "./PropertyStatusBadge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PropertyTypeBadge } from "./PropertyTypeBadge";
import { PropertyRowActions } from "./PropertyRowActions";
import { formatDistanceToNowThai } from "@/lib/utils";
import Link from "next/link";
import { PropertyPrice } from "./PropertyPrice";
import { PropertiesEmptyState } from "./PropertiesEmptyState";
import { PropertyStatusSelect } from "./PropertyStatusDropdown";
import { SocialStatusBadges } from "./SocialStatusBadges";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  bulkDeletePropertiesAction,
  bulkMovePropertiesToTenantAction,
  bulkApproveAiReviewAction,
  getAllPropertyIdsAction,
} from "@/features/properties/bulk-actions";
import { exportPropertiesAction } from "@/features/properties/export-action";
import { toast } from "sonner";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { Button } from "@/components/ui/button";
import { DuplicatePropertyButton } from "./DuplicatePropertyButton";
import type {
  PropertyStatus,
  PropertyType,
  ListingType,
  PropertyTableData,
} from "@/features/properties/types";
import { cn } from "@/lib/utils";
import { FaLine, FaTiktok, FaFacebook } from "react-icons/fa";
import { RiInstagramFill } from "react-icons/ri";
import { downloadBase64File, MIME_TYPES } from "@/lib/download-utils";
interface PropertiesTableProps {
  data: PropertyTableData[];
  isAdmin?: boolean;
  isMultiTenant?: boolean;
  currentTenantId?: string | null;
  currentTenantName?: string | null;
  showBranch?: boolean;
  totalCount: number;
  filters?: any;
}
// ... (SortableHead code omitted for brevity as it is unchanged) ...

function SortableHead({
  label,
  sortKey,
  className,
}: {
  label: string;
  sortKey: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentBy = searchParams.get("sortBy") || "created_at";
  const currentOrder = (searchParams.get("sortOrder") || "desc") as
    | "asc"
    | "desc";

  const isActive = currentBy === sortKey;

  const icon = !isActive ? (
    <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
  ) : currentOrder === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );

  const defaultDesc = new Set(["updated_at", "created_at", "price"]);

  const onClick = () => {
    const params = new URLSearchParams(searchParams.toString());

    const nextOrder = isActive
      ? currentOrder === "asc"
        ? "desc"
        : "asc"
      : defaultDesc.has(sortKey)
        ? "desc"
        : "asc";

    params.set("sortBy", sortKey);
    params.set("sortOrder", nextOrder);
    params.delete("page"); // เปลี่ยน sort แล้วกลับหน้า 1

    router.push(`/protected/properties?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 text-left font-semibold hover:text-foreground transition-colors",
        className || "",
      ].join(" ")}
      aria-label={`เรียงตาม ${label}`}
      title={`เรียงตาม ${label}`}
    >
      {label}
      {icon}
    </button>
  );
}



export function PropertiesTable({
  data,
  isAdmin,
  isMultiTenant,
  currentTenantId,
  currentTenantName,
  showBranch,
  totalCount,
  filters = {},
}: PropertiesTableProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const pathname = usePathname();
  const allIds = useMemo(() => data.map((p) => p.id), [data]);
  const {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartialSelected,
    selectedCount,
  } = useTableSelection(allIds);

  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const [isTransitionPending, startTransition] = useTransition();

  const handleSelectAllGlobal = async () => {
    const processId = startProcess("เลือกทรัพย์ทั้งหมดในระบบ", { type: "SELECTION" });
    setIsGlobalLoading(true);
    try {
      const result = await getAllPropertyIdsAction(filters);
      if (result.success && result.ids) {
        toggleSelectAll(result.ids);
        finishProcess(processId, "SUCCESS", `เลือกทั้งหมด ${result.ids.length} รายการเรียบร้อยแล้ว`);
      } else {
        finishProcess(processId, "ERROR", "ไม่สามารถเลือกทั้งหมดได้");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเลือกทั้งหมด";
      finishProcess(processId, "ERROR", msg);
    } finally {
      setIsGlobalLoading(false);
    }
  };

  const blockedCount = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const p = data.find((item) => item.id === id);
      return p?.status === "SOLD" || p?.status === "RENTED";
    }).length;
  }, [selectedIds, data]);

  const pullableCount = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const p = data.find((item) => item.id === id);
      return p?.tenant_id === null || p?.tenant_id === undefined;
    }).length;
  }, [selectedIds, data]);

  const confirmMessage = useMemo(() => {
    const total = selectedCount;
    const canDelete = total - blockedCount;

    if (blockedCount > 0) {
      return (
        <span className="space-y-2 block">
          <span>
            คุณกำลังจะลบ <strong className="text-foreground">{total}</strong>{" "}
            รายการ
          </span>
          <span className="block text-amber-600 text-sm bg-amber-50 p-2 rounded border border-amber-200">
            ⚠️ มี {blockedCount} รายการที่มีสถานะ "ขายแล้ว" หรือ "เช่าแล้ว"
            ซึ่งจะไม่ถูกลบออกจากระบบ
          </span>
          {canDelete > 0 && (
            <span className="block text-emerald-600 text-sm font-medium">
              ✅ ระบบจะทำการลบเฉพาะ {canDelete} รายการที่เหลือเท่านั้น
            </span>
          )}
        </span>
      );
    }
    return null;
  }, [selectedCount, blockedCount]);

  const pullConfirmMessage = useMemo(() => {
    const selectedProperties = Array.from(selectedIds)
      .map((id) => data.find((p) => p.id === id))
      .filter((p): p is PropertyTableData => !!p);

    const pullable = selectedProperties.filter(
      (p) => p.tenant_id === null || p.tenant_id === undefined,
    );
    const skipped = selectedProperties.filter(
      (p) => p.tenant_id !== null && p.tenant_id !== undefined,
    );

    const total = selectedCount;
    const canPull = pullable.length;

    if (total === 0) return null;

    // Get unique branch names from skipped properties
    const skippedBranches = Array.from(
      new Set(
        skipped.map((p) => {
          const name = p.tenant_name || "ไม่ระบุสาขา";
          if (currentTenantId && p.tenant_id === currentTenantId) {
            return `${name} (สาขาคุณ)`;
          }
          return name;
        }),
      ),
    );

    return (
      <span className="space-y-2 block text-left">
        <span>
          คุณกำลังจะดึง <strong className="text-foreground">{canPull}</strong>{" "}
          ทรัพย์สินที่ยังไม่มีสาขา มายังสาขาของคุณ
        </span>
        {skipped.length > 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
            <p className="font-medium mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              ⚠️ ระบบจะข้าม {skipped.length} รายการที่มีสาขาอยู่แล้ว:
            </p>
            <ul className="list-disc list-inside pl-1 space-y-0.5 opacity-80 decoration-amber-300">
              {skippedBranches.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        )}
      </span>
    );
  }, [selectedIds, data, selectedCount]);

  if (data.length === 0) {
    return <PropertiesEmptyState />;
  }

  const handleSuccessFeedback = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("success", "true");
    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const processId = startProcess(`ลบข้อมูลทรัพย์ (${ids.length} รายการ)`, { 
      type: "BULK_DELETE",
      onRetry: handleBulkDelete 
    });
    
    try {
      const result = await bulkDeletePropertiesAction(ids);
      if (result.success) {
        finishProcess(processId, "SUCCESS", result.message);
        clearSelection();
        handleSuccessFeedback();
      } else {
        finishProcess(processId, "ERROR", result.message || "เกิดข้อผิดพลาดในการลบ");
        throw new Error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบ";
      finishProcess(processId, "ERROR", msg);
      throw err;
    }
  };

  const handleBulkApproveAiReview = async () => {
    const ids = Array.from(selectedIds);
    const processId = startProcess(`ยืนยันข้อมูล AI (${ids.length} รายการ)`, { 
      type: "BULK_AI_APPROVE",
      onRetry: handleBulkApproveAiReview
    });

    try {
      const result = await bulkApproveAiReviewAction(ids);
      if (result.success) {
        finishProcess(processId, "SUCCESS", result.message);
        clearSelection();
        handleSuccessFeedback();
      } else {
        finishProcess(processId, "ERROR", result.message || "เกิดข้อผิดพลาด");
        throw new Error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการยืนยันข้อมูล";
      finishProcess(processId, "ERROR", msg);
      throw err;
    }
  };

  const handleBulkMove = async () => {
    const ids = Array.from(selectedIds);
    const processId = startProcess(`ดึงทรัพย์มายังสาขา (${ids.length} รายการ)`, { 
      type: "BULK_MOVE",
      onRetry: handleBulkMove
    });

    try {
      const result = await bulkMovePropertiesToTenantAction(ids);
      if (result.success) {
        finishProcess(processId, "SUCCESS", result.message);
        clearSelection();
        handleSuccessFeedback();
      } else {
        finishProcess(processId, "ERROR", result.message || "เกิดข้อผิดพลาด");
        throw new Error(result.message || "เกิดข้อผิดพลาด");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
      finishProcess(processId, "ERROR", msg);
      throw err;
    }
  };

  const handleExportAllWithFilters = async () => {
    const processId = startProcess("กำลังส่งออกข้อมูล Excel", { type: "EXPORT" });
    setIsExporting(true);
    try {
      const result = await exportPropertiesAction(undefined, filters);
      if (result.success && result.data && result.filename) {
        const downloaded = downloadBase64File(
          result.data,
          result.filename,
          MIME_TYPES.EXCEL,
        );
        if (downloaded) {
          finishProcess(processId, "SUCCESS", `Export ทั้งหมด ${result.count} รายการสำเร็จ`);
        } else {
          finishProcess(processId, "ERROR", "ดาวน์โหลดไฟล์ไม่สำเร็จ");
        }
      } else {
        finishProcess(processId, "ERROR", result.message || "Export ไม่สำเร็จ");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการ Export";
      finishProcess(processId, "ERROR", msg);
    } finally {
      setIsExporting(false);
    }
  };

  const hasAiReviewItems = useMemo(() => {
    return Array.from(selectedIds).some((id) => {
      const p = data.find((item) => item.id === id);
      return p?.requires_ai_review;
    });
  }, [selectedIds, data]);

  return (
    <div className="space-y-4">
      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
        onDeleteLabel="ย้ายลงถังขยะ"
        onExport={() => exportPropertiesAction(Array.from(selectedIds))}
        onPull={
          isMultiTenant &&
          currentTenantId && 
          currentTenantId !== "ALL" && 
          !showBranch 
            ? handleBulkMove 
            : undefined
        }
        onPullLabel="ดึงมาสาขาตัวเอง"
        onPullConfirmMessage={pullConfirmMessage}
        onAiApprove={hasAiReviewItems ? handleBulkApproveAiReview : undefined}
        onAiApproveLabel="ยืนยันข้อมูล AI"
        entityName="ทรัพย์"
        actionableCount={selectedCount - blockedCount}
        className={isTransitionPending ? "opacity-50 pointer-events-none" : ""}
      />

      {/* Primary Toolbar Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {selectedCount === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAllWithFilters}
              disabled={isExporting}
              className="h-9 px-4 text-xs font-bold border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all rounded-xl shadow-xs"
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-2" />
              )}
              Export รายการที่เลือกตามฟิลเตอร์ (Excel/CSV)
            </Button>
          )}
        </div>
        
        {/* Pagination placeholder if needed, or other tools */}
      </div>

      {/* Global Selection Indicator */}
      {isAllSelected && selectedCount < totalCount && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <span>เลือกทั้งหมด {selectedCount} ทรัพย์ในหน้านี้แล้ว</span>
          </div>
          <button
            onClick={handleSelectAllGlobal}
            disabled={isGlobalLoading}
            className="text-sm font-bold text-blue-700 hover:text-blue-900 px-4 py-1.5 bg-white rounded-lg border border-blue-200 shadow-xs hover:shadow-md transition-all flex items-center gap-2"
          >
            {isGlobalLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            เลือกทั้งหมด {totalCount} ทรัพย์ในระบบ
          </button>
        </div>
      )}

      {selectedCount === totalCount && totalCount > data.length && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>คุณได้เลือกทั้งหมด <strong>{totalCount}</strong> ทรัพย์ในระบบแล้ว (ทุกหน้า)</span>
          </div>
          <button
            onClick={clearSelection}
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900 px-4 py-1.5 bg-white rounded-lg border border-emerald-200 shadow-xs hover:shadow-md transition-all"
          >
            ยกเลิกการเลือก
          </button>
        </div>
      )}

      <div id="tour-property-list-top" className="rounded-md border border-gray-200 shadow-sm bg-card overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              {/* Rest of the table header content ... */}
              <TableRow className="bg-muted/50 hover:bg-muted/50 ">
                <TableHead className="w-[40px] px-2">
                  <div className="p-2 -m-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={() => toggleSelectAll(allIds)}
                      aria-label="เลือกทั้งหมด"
                      className={
                        isPartialSelected
                          ? "data-[state=checked]:bg-primary/50"
                          : ""
                      }
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[280px] px-2">
                  <SortableHead label="ทรัพย์" sortKey="created_at" />
                </TableHead>
                <TableHead className="w-[90px] px-2 text-[11px]">
                  <SortableHead label="ชนิด" sortKey="property_type" />
                </TableHead>
                <TableHead className="w-[140px] px-2 text-[11px]">ทำเล</TableHead>
                <TableHead className="w-[111px] px-2 text-[11px]">
                  <SortableHead label="ราคา" sortKey="price" />
                </TableHead>
                <TableHead className="w-[85px] px-2 text-[11px]">Leads</TableHead>
                <TableHead className="w-[100px] px-2 text-[11px]">
                  <SortableHead label="Update" sortKey="updated_at" />
                </TableHead>
                <TableHead className="w-[150px] px-2 text-[11px]">
                  ดูแล
                </TableHead>
                <TableHead className="w-[90px] px-2 text-[11px]">
                  <SortableHead label="สถานะ" sortKey="status" />
                </TableHead>
                <TableHead className="w-[90px] px-2 text-[11px]">Social</TableHead>
                <TableHead className="w-[80px] px-2 text-right pr-4 text-[11px]">
                  จัดการ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((property) => (
                <TableRow
                  key={property.id}
                  className={`group hover:bg-slate-50/50 ${
                    isSelected(property.id) ? "bg-blue-50/50 " : ""
                  }`}
                >
                  {/* CHECKBOX */}
                  <TableCell className="w-[40px] px-2">
                    <Checkbox
                      checked={isSelected(property.id)}
                      onCheckedChange={() => toggleSelect(property.id)}
                      aria-label={`เลือก ${property.title}`}
                    />
                  </TableCell>
                  {/* PROPERTY NAME & COVER */}
                  <TableCell className="px-2 whitespace-normal">
                    <div className="flex items-start gap-3">
                      <div className="relative h-[60px] w-[80px] shrink-0 overflow-hidden rounded-lg bg-slate-100 group/image cursor-zoom-in">
                        {property.image_url ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="w-full h-full overflow-hidden relative">
                                <Image
                                  src={property.image_url}
                                  alt={property.title || "Property"}
                                  fill
                                  sizes="80px"
                                  className="object-cover transition-transform duration-300 group-hover/image:scale-110"
                                />
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
                              <VisuallyHidden>
                                <DialogTitle>
                                  {property.title || "Property Image"}
                                </DialogTitle>
                              </VisuallyHidden>
                              <div className="relative w-full h-[70vh] flex items-center justify-center bg-transparent">
                                <Image
                                  src={property.image_url}
                                  alt={property.title || "Property Image"}
                                  fill
                                  sizes="100vw"
                                  className="object-contain shadow-2xl rounded-lg"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100">
                            <ImageIcon className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                        {property.is_new && (
                          <Badge className="absolute top-0.5 left-0.5 h-4 px-1 text-[11px] bg-blue-500 hover:bg-blue-600 border-0 pointer-events-none shadow-sm">
                            NEW
                          </Badge>
                        )}
                        {property.requires_ai_review && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute top-1 right-1 h-6 w-6 bg-white/95 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center border border-amber-200 cursor-help group-hover/image:scale-110 transition-transform duration-300">
                                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="p-3 max-w-[200px] bg-slate-900 text-white border-slate-800 shadow-2xl rounded-xl">
                                <div className="space-y-1.5 text-[11px]">
                                  <p className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Sparkles className="h-3 w-3" /> Sentinel Verification Needed
                                  </p>
                                  <p className="text-slate-300 leading-relaxed font-medium">คำบรรยายหรือข้อมูลสำคัญถูกสร้างโดย AI และยังไม่ผ่านการตรวจสอบโดยแอดมิน</p>
                                  <div className="pt-1.5 border-t border-white/10 mt-1.5 flex items-center justify-between opacity-80 italic">
                                    <span>Status: Pending Audit</span>
                                    <span>V1.0</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0 ">
                        <div
                          onClick={() => {
                            setNavigatingId(property.id);
                            router.push(`/protected/properties/${property.id}`);
                          }}
                          className="block font-semibold text-slate-900 hover:text-blue-600 transition-colors text-sm leading-snug cursor-pointer relative"
                        >
                          {navigatingId === property.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600 absolute -left-6 top-1/2 -translate-y-1/2" />
                          )}
                          <span className="line-clamp-2 overflow-hidden w-[310px] ">
                            {property.title || "ไม่ระบุชื่อ"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 line-clamp-1 opacity-90 leading-tight">
                          {[property.popular_area, property.province]
                            .filter(Boolean)
                            .join(" • ") || property.description || "-"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded border border-slate-100 shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDistanceToNowThai(property.created_at)}
                          </span>
                          {showBranch && property.tenant_name && (
                            <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 max-w-[100px] truncate shrink-0" title={property.tenant_name}>
                              <Building2 className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{property.tenant_name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* TYPE */}
                  <TableCell className="px-2">
                    <div className="flex flex-col items-start gap-1">
                      <PropertyTypeBadge type={property.property_type} className="py-1 text-[11px] px-3" />
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                        {property.listing_type === "SALE"
                          ? "ขาย"
                          : property.listing_type === "RENT"
                            ? "เช่า"
                            : "ขาย/เช่า"}
                      </span>
                    </div>
                  </TableCell>

                  {/* LOCATION & ASSET INFO */}
                  <TableCell className="px-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="font-medium text-[11px] text-slate-700 line-clamp-1">
                        {property.popular_area || property.subdistrict || property.district || "-"}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        {property.size_sqm ? (
                          <span className="shrink-0">{property.size_sqm} m²</span>
                        ) : null}
                        {property.land_size_sqwah ? (
                          <span className="shrink-0">{property.land_size_sqwah} w²</span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-slate-400 flex gap-1.5">
                        {property.bedrooms ? <span>{property.bedrooms}น</span> : null}
                        {property.bathrooms ? <span>{property.bathrooms}น้ำ</span> : null}
                      </div>
                    </div>
                  </TableCell>

                  {/* PRICE */}
                  <TableCell className="px-2">
                    <PropertyPrice
                      variant="table"
                      listingType={property.listing_type}
                      price={property.price}
                      originalPrice={property.original_price}
                      rentalPrice={property.rental_price}
                      originalRentalPrice={property.original_rental_price}
                    />
                  </TableCell>

                  {/* INTEREST & STOCK */}
                  <TableCell className="px-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                        <Users className="h-2.5 w-2.5 text-blue-500" />
                        <span>{property.leads_count}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Eye className="h-2.5 w-2.5" />
                        <span>{property.view_count || 0}</span>
                      </div>
                      {(property.total_units || 0) > 1 && (
                        <div className="text-[8px] bg-slate-50 px-1 py-0.5 rounded border border-slate-100 w-fit">
                          <span className={(property.total_units || 0) - (property.sold_units || 0) > 0 ? "text-emerald-600" : "text-red-500"}>
                            {(property.total_units || 0) - (property.sold_units || 0)}/{property.total_units}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* UPDATED */}
                  <TableCell className="px-2">
                    <div className="text-[11px] text-slate-500 line-clamp-1 opacity-80 max-w-[80px] truncate" title={new Date(property.updated_at).toLocaleString("th-TH")}>
                      {formatDistanceToNowThai(property.updated_at)}
                    </div>
                  </TableCell>

                  {/* BUYER / TENANT / AGENT */}
                  <TableCell className="px-2">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col gap-1 min-w-0">
                            {/* CASE 1: SOLD/RENTED WITH LEAD */}
                            {(property.status === "SOLD" || property.status === "RENTED") && property.closed_lead_name ? (
                              <div className="flex flex-col gap-0.5">
                                <div 
                                  onClick={() => {
                                    setNavigatingId(`lead-${property.id}`);
                                    router.push(`/protected/leads?stage=CLOSED`);
                                  }}
                                  className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 max-w-[120px] truncate cursor-pointer hover:bg-emerald-100 transition-all shadow-sm"
                                >
                                  {navigatingId === `lead-${property.id}` ? (
                                    <Loader2 className="h-2.5 w-2.5 animate-spin text-emerald-600" />
                                  ) : (
                                    <Users className="h-3 w-3 text-emerald-500 shrink-0" />
                                  )}
                                  <span className="truncate leading-tight">คุณ {property.closed_lead_name}</span>
                                </div>
                                <div className="text-[9px] text-slate-400 font-medium px-1 truncate max-w-[100px] flex items-center gap-1.5">
                                  <div className="h-1 w-1 rounded-full bg-slate-300 shrink-0" />
                                  <span className="truncate text-slate-500/80">{property.agent_name || "Me"}</span>
                                </div>
                              </div>
                            ) : (
                              /* CASE 2: REGULAR ASSIGNEE */
                              <div className="text-[11px] text-slate-500 flex flex-col gap-0.5">
                                <span className="font-bold text-blue-600 truncate max-w-[100px] flex items-center gap-1.5">
                                  <Users className="h-3 w-3 text-blue-400 shrink-0" />
                                  {property.agent_name || "ไม่มีผู้ดูแล"}
                                </span>
                                <span className="text-[9px] text-slate-400 opacity-70 ml-4.5 pl-4.5">
                                  ผู้ดูแลทรัพย์
                                </span>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="p-3 bg-white border-slate-200 shadow-xl rounded-xl">
                          <div className="space-y-2">
                            {(property.status === "SOLD" || property.status === "RENTED") && property.closed_lead_name && (
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ลูกค้า (Lead)</p>
                                <p className="text-sm font-bold text-emerald-700">คุณ {property.closed_lead_name}</p>
                              </div>
                            )}
                            <div className="space-y-0.5 border-t border-slate-100 pt-1.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ผู้รับผิดชอบ (Agent)</p>
                              <p className="text-sm font-bold text-blue-700">{property.agent_name || "ยังไม่ได้มอบหมาย"}</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  {/* STATUS */}
                  <TableCell className="px-2">
                    <PropertyStatusSelect
                      id={property.id}
                      value={property.status as PropertyStatus}
                      className="h-7 w-[110px] text-[11px] px-2"
                    />
                  </TableCell>

                  {/* SOCIAL */}
                  <TableCell className="px-2">
                    <SocialStatusBadges
                      facebookAt={property.posted_to_facebook_at}
                      instagramAt={property.posted_to_instagram_at}
                      lineAt={property.posted_to_line_at}
                      tiktokAt={property.posted_to_tiktok_at}
                    />
                  </TableCell>

                  {/* ACTIONS */}
                  <TableCell className="text-right px-2 pr-4">
                    <div className="flex justify-end items-center gap-0.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-slate-400 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setNavigatingId(`view-${property.id}`);
                          router.push(`/protected/properties/${property.id}`);
                        }}
                        disabled={navigatingId === `view-${property.id}`}
                      >
                        {navigatingId === `view-${property.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => {
                          setNavigatingId(`edit-${property.id}`);
                          router.push(`/protected/properties/${property.id}/edit`);
                        }}
                        disabled={navigatingId === `edit-${property.id}`}
                      >
                        {navigatingId === `edit-${property.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Edit3 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <DuplicatePropertyButton id={property.id} className="h-7 w-7 text-slate-400 hover:text-purple-600 hover:bg-purple-50" />
                      <PropertyRowActions id={property.id} title={property.title} status={property.status} tenantId={property.tenant_id} isAdmin={isAdmin} isMultiTenant={isMultiTenant} className="h-7 w-7" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile/Tablet Card View - Premium Responsive Grid */}
        <div className="lg:hidden p-3 min-[400px]:p-4 min-[500px]:p-6">
          <div className="grid grid-cols-1 gap-3 min-[400px]:gap-4 min-[500px]:gap-6">
            {data.map((property) => (
              <div
                key={property.id}
                className={cn(
                  "relative group bg-white rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden",
                  isSelected(property.id)
                    ? "border-blue-500 ring-2 ring-blue-500/10"
                    : "border-slate-200",
                )}
              >
                {navigatingId === `card-${property.id}` && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                )}
                <div 
                  className="absolute top-0 left-0 p-3 min-[400px]:p-4 z-30 cursor-pointer group/check"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSelect(property.id);
                  }}
                >
                  <Checkbox
                    checked={isSelected(property.id)}
                    onCheckedChange={() => toggleSelect(property.id)}
                    className="h-6 w-6 bg-white/90 backdrop-blur-sm border-slate-300 shadow-sm data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all group-hover/check:scale-110"
                  />
                </div>

                {/* Card Header/Actions Button */}
                <div className="absolute top-2.5 right-2.5 min-[400px]:top-3 min-[400px]:right-3 z-30 flex items-center gap-1.5">
                  <div className="p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm">
                    <PropertyRowActions
                      id={property.id}
                      title={property.title}
                      status={property.status}
                      tenantId={property.tenant_id}
                      isAdmin={isAdmin}
                      isMultiTenant={isMultiTenant}
                    />
                  </div>
                </div>

                <div
                  onClick={() => {
                    setNavigatingId(`card-${property.id}`);
                    router.push(`/protected/properties/${property.id}`);
                  }}
                  className="block relative aspect-16/10 overflow-hidden cursor-pointer"
                >
                  {property.requires_ai_review && (
                    <div className="absolute bottom-2.5 right-2.5 z-30 p-1.5 bg-white shadow-md rounded-full flex items-center justify-center border border-amber-200" title="รอยืนยันข้อมูล AI">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                  )}
                  {property.image_url ? (
                    <img
                      src={property.image_url}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-slate-100">
                      <ImageIcon className="h-10 w-10 text-slate-300" />
                    </div>
                  )}

                  {/* Status Badges Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <PropertyTypeBadge
                        type={property.property_type}
                        className="h-5 text-[11px] min-[400px]:text-[11px] px-1.5 min-[400px]:px-2 bg-white/90 backdrop-blur-sm shadow-sm border-none font-bold "
                      />
                      {property.is_new && (
                        <Badge className="h-5 text-[11px] min-[400px]:text-[11px] px-1.5 min-[400px]:px-2 bg-blue-600 text-white border-none shadow-sm font-bold">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <PropertyStatusBadge
                      status={property.status}
                      className="h-5 text-[11px] min-[400px]:text-[11px] px-1.5 min-[400px]:px-2 font-bold shadow-md backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-3 min-[400px]:p-4 space-y-2.5 min-[400px]:space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2 min-w-0">
                      <div
                        onClick={() => {
                          setNavigatingId(`card-${property.id}`);
                          router.push(`/protected/properties/${property.id}`);
                        }}
                        className="font-bold text-slate-900 text-sm min-[400px]:text-base leading-snug line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {property.title || "ไม่ระบุชื่อ"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] min-[400px]:text-xs text-slate-500">
                      <MapPin className="h-3 w-3 min-[400px]:h-3.5 min-[400px]:w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {property.popular_area || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="py-2 border-y border-slate-100">
                    <PropertyPrice
                      variant="card"
                      listingType={property.listing_type}
                      price={property.price}
                      originalPrice={property.original_price}
                      rentalPrice={property.rental_price}
                      originalRentalPrice={property.original_rental_price}
                    />
                  </div>

                  {/* Meta Stats & Agent */}
                  <div className="flex flex-col gap-2.5 pt-0.5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] min-[400px]:text-[11px] font-bold text-slate-600">
                        <Users className="h-3 w-3 min-[400px]:h-3.5 min-[400px]:w-3.5 text-blue-500" />
                        {property.leads_count}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] min-[400px]:text-[11px] font-bold text-slate-600">
                        <Eye className="h-3 w-3 min-[400px]:h-3.5 min-[400px]:w-3.5 text-slate-400" />
                        {property.view_count || 0}
                      </div>

                      {/* Social Badges for Mobile */}
                      <SocialStatusBadges
                        facebookAt={property.posted_to_facebook_at}
                        instagramAt={property.posted_to_instagram_at}
                        lineAt={property.posted_to_line_at}
                        tiktokAt={property.posted_to_tiktok_at}
                        className="ml-auto"
                      />
                    </div>

                    {showBranch && (
                      <div className="flex items-center gap-1.5 w-full">
                        <Badge
                          variant="secondary"
                          className="w-full justify-center bg-blue-50/50 text-blue-700 hover:bg-blue-100 border-blue-100/50 text-[10px] min-[400px]:text-[11px] font-bold h-7 rounded-lg"
                        >
                          สาขา: {property.tenant_name || "ไม่มีสาขา"}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 w-full">
                      <PropertyStatusSelect
                        id={property.id}
                        value={property.status as PropertyStatus}
                        className="h-8 w-full text-[10px] min-[400px]:text-[11px] font-bold shadow-xs transition-shadow hover:shadow-md border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50 mt-1">
                    <span className="text-[10px] min-[400px]:text-[11px] text-slate-400 font-medium">
                      อัปเดต{" "}
                      {formatDistanceToNowThai(property.updated_at)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        onClick={() => {
                          setNavigatingId(`view-m-${property.id}`);
                          router.push(`/protected/properties/${property.id}`);
                        }}
                        disabled={navigatingId === `view-m-${property.id}`}
                      >
                        {navigatingId === `view-m-${property.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        onClick={() => {
                          setNavigatingId(`edit-m-${property.id}`);
                          router.push(`/protected/properties/${property.id}/edit`);
                        }}
                        disabled={navigatingId === `edit-m-${property.id}`}
                      >
                        {navigatingId === `edit-m-${property.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                        ) : (
                          <Edit3 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-2 px-4 pb-6">
        <PaginationControls
          totalCount={totalCount}
          pageSize={10}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}
