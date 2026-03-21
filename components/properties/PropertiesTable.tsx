"use client";

import React, { useMemo } from "react";
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
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import { PropertyPrice } from "./PropertyPrice";
import { PropertiesEmptyState } from "./PropertiesEmptyState";
import { PropertyStatusSelect } from "./PropertyStatusDropdown";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import {
  bulkDeletePropertiesAction,
  bulkMovePropertiesToTenantAction,
  getAllPropertyIdsAction,
} from "@/features/properties/bulk-actions";
import { exportPropertiesAction } from "@/features/properties/export-action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DuplicatePropertyButton } from "./DuplicatePropertyButton";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import type {
  PropertyStatus,
  PropertyType,
  ListingType,
  PropertyTableData,
} from "@/features/properties/types";
import { cn } from "@/lib/utils";
import { FaLine, FaTiktok } from "react-icons/fa";

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

function SocialStatusBadges({
  facebookAt,
  instagramAt,
  lineAt,
  tiktokAt,
  className,
}: {
  facebookAt?: string | null;
  instagramAt?: string | null;
  lineAt?: string | null;
  tiktokAt?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-row items-center gap-1 ", className)}>
      {/* Facebook */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "p-1 rounded-md border transition-all duration-200",
                facebookAt
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <Facebook className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {facebookAt
                ? `โพสต์บน Facebook เมื่อ ${format(new Date(facebookAt), "d MMM yyyy HH:mm", { locale: th })}`
                : "ยังไม่ได้โพสต์บน Facebook"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Instagram */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "p-1 rounded-md border transition-all duration-200",
                instagramAt
                  ? "bg-pink-50 border-pink-200 text-pink-600"
                  : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <Instagram className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {instagramAt
                ? `โพสต์บน Instagram เมื่อ ${format(new Date(instagramAt), "d MMM yyyy HH:mm", { locale: th })}`
                : "ยังไม่ได้โพสต์บน Instagram"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Line */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "p-1 rounded-md border transition-all duration-200",
                lineAt
                  ? "bg-green-50 border-green-200 text-green-600"
                  : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <FaLine className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {lineAt
                ? `แชร์บน Line เมื่อ ${format(new Date(lineAt), "d MMM yyyy HH:mm", { locale: th })}`
                : "ยังไม่ได้แชร์บน Line"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* TikTok */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "p-1 rounded-md border transition-all duration-200",
                tiktokAt
                  ? "bg-slate-900 border-slate-700 text-white"
                  : "bg-slate-50 border-slate-100 text-slate-200",
              )}
            >
              <FaTiktok className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-[11px] font-medium">
              {tiktokAt
                ? `โพสต์บน TikTok เมื่อ ${format(new Date(tiktokAt), "d MMM yyyy HH:mm", { locale: th })}`
                : "ยังไม่ได้โพสต์บน TikTok"}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
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

  const handleSelectAllGlobal = async () => {
    setIsGlobalLoading(true);
    try {
      const result = await getAllPropertyIdsAction(filters);
      if (result.success && result.ids) {
        toggleSelectAll(result.ids);
        toast.info(`เลือกทั้งหมด ${result.ids.length} รายการแล้ว`);
      }
    } catch (err) {
      toast.error("ไม่สามารถเลือกทั้งหมดได้");
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
    const result = await bulkDeletePropertiesAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      handleSuccessFeedback();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleBulkMove = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkMovePropertiesToTenantAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
      handleSuccessFeedback();
    } else {
      toast.error(result.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onDelete={handleBulkDelete}
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
        entityName="ทรัพย์"
        actionableCount={selectedCount - blockedCount}
      />

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

      <div className="rounded-md border border-gray-200 shadow-sm bg-card overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              {/* Rest of the table header content ... */}
              <TableRow className="bg-muted/50 hover:bg-muted/50 ">
                <TableHead className="w-[40px] px-2">
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
                      </div>
                      <div className="flex flex-col gap-1 min-w-0 ">
                        <Link
                          href={`/protected/properties/${property.id}`}
                          className="block font-semibold text-slate-900 hover:text-blue-600 transition-colors text-sm leading-snug "
                        >
                          <span className="line-clamp-2 overflow-hidden w-[310px] ">
                            {property.title || "ไม่ระบุชื่อ"}
                          </span>
                        </Link>
                        <span className="text-[11px] text-slate-500 line-clamp-1 opacity-90 leading-tight">
                          {property.popular_area || property.description || "-"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded border border-slate-100 shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDistanceToNow(new Date(property.created_at), {
                              addSuffix: true,
                              locale: th,
                            })}
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
                      {formatDistanceToNow(new Date(property.updated_at), { addSuffix: true, locale: th })}
                    </div>
                  </TableCell>

                  {/* BUYER / TENANT / AGENT */}
                  <TableCell className="px-2">
                    {property.status === "SOLD" || property.status === "RENTED" ? (
                      property.closed_lead_name ? (
                        <Link href={`/protected/leads?stage=CLOSED`} className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 max-w-[80px] truncate">
                          <span className="truncate">คุณ {property.closed_lead_name}</span>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">ปิดดีล</span>
                      )
                    ) : (
                      <div className="text-[11px] text-slate-500 truncate max-w-[80px]">
                        <span className="font-medium text-blue-600">{property.agent_name || "Me"}</span>
                      </div>
                    )}
                  </TableCell>

                  {/* STATUS */}
                  <TableCell className="px-2">
                    <PropertyStatusSelect
                      id={property.id}
                      value={property.status as PropertyStatus}
                      className="h-7 w-[90px] text-[11px] px-2"
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
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-700 hover:bg-blue-50">
                        <Link href={`/protected/properties/${property.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-amber-700 hover:bg-amber-50">
                        <Link href={`/protected/properties/${property.id}/edit`}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <DuplicatePropertyButton id={property.id} className="h-7 w-7 text-slate-400 hover:text-purple-600 hover:bg-purple-50" />
                      <PropertyRowActions id={property.id} title={property.title} tenantId={property.tenant_id} isAdmin={isAdmin} isMultiTenant={isMultiTenant} className="h-7 w-7" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile/Tablet Card View - Premium Responsive Grid */}
        <div className="lg:hidden p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map((property) => (
              <div
                key={property.id}
                className={cn(
                  "relative group bg-white rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md",
                  isSelected(property.id)
                    ? "border-blue-500 ring-1 ring-blue-500/20"
                    : "border-slate-200",
                )}
              >
                {/* Checkbox Overlay */}
                <div className="absolute top-3 left-3 z-30">
                  <Checkbox
                    checked={isSelected(property.id)}
                    onCheckedChange={() => toggleSelect(property.id)}
                    className="h-5 w-5 bg-white/80 backdrop-blur-sm border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                </div>

                {/* Card Header/Actions Button */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                  <div className="p-1 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 shadow-sm">
                    <PropertyRowActions
                      id={property.id}
                      title={property.title}
                      tenantId={property.tenant_id}
                      isAdmin={isAdmin}
                      isMultiTenant={isMultiTenant}
                    />
                  </div>
                </div>

                <Link
                  href={`/protected/properties/${property.id}`}
                  className="block relative aspect-16/10 overflow-hidden rounded-t-xl"
                >
                  {property.image_url ? (
                    <img
                      src={property.image_url}
                      alt={property.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-slate-50">
                      <ImageIcon className="h-10 w-10 text-slate-200" />
                    </div>
                  )}

                  {/* Status Badges Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <PropertyTypeBadge
                        type={property.property_type}
                        className="h-5 text-[11px] px-2 bg-white/90 backdrop-blur-sm shadow-sm border-none font-medium text-white"
                      />
                      {property.is_new && (
                        <Badge className="h-5 text-[11px] px-2 bg-blue-600 text-white border-none shadow-sm font-bold">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <PropertyStatusBadge
                      status={property.status}
                      className="h-5 text-[10px] px-2 font-bold shadow-md backdrop-blur-sm"
                    />
                  </div>
                </Link>

                {/* Property Details */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <Link
                        href={`/protected/properties/${property.id}`}
                        className="font-bold text-slate-900 text-base leading-snug line-clamp-1 hover:text-blue-600 transition-colors"
                      >
                        {property.title || "ไม่ระบุชื่อ"}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {property.popular_area || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="py-2.5 border-y border-slate-100">
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
                  <div className="flex items-center justify-between gap-2 pt-1 flex-col">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        {property.leads_count}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
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
                          className="w-full justify-center bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 text-[11px] font-bold h-7"
                        >
                          สาขา: {property.tenant_name || "ไม่มีสาขา"}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 w-full">
                      <PropertyStatusSelect
                        id={property.id}
                        value={property.status as PropertyStatus}
                        className="h-7 w-full text-[11px] font-bold shadow-xs transition-shadow hover:shadow-md border-slate-200"
                      />
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      อัปเดต{" "}
                      {formatDistanceToNow(new Date(property.updated_at), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Link href={`/protected/properties/${property.id}`}>
                          <Eye className="h-4.5 w-4.5" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                      >
                        <Link
                          href={`/protected/properties/${property.id}/edit`}
                        >
                          <Edit3 className="h-4.5 w-4.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
