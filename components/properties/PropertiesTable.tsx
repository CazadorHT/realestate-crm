"use client";

import { useMemo } from "react";
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
import { ImageIcon, Users, Clock } from "lucide-react";
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
import type {
  PropertyStatus,
  PropertyType,
  ListingType,
} from "@/features/properties/types";
import { Button } from "@/components/ui/button";
import { Eye, Edit3, MapPin } from "lucide-react";
import { DuplicatePropertyButton } from "./DuplicatePropertyButton";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionToolbar } from "@/components/ui/bulk-action-toolbar";
import { bulkDeletePropertiesAction } from "@/features/properties/bulk-actions";
import { exportPropertiesAction } from "@/features/properties/export-action";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface PropertyTableData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  property_type: PropertyType;
  listing_type: ListingType;
  price: number | null;
  rental_price: number | null;
  status: PropertyStatus;
  leads_count: number;
  updated_at: string;
  created_at: string;
  closed_lead_name: string | null;
  is_hot?: boolean;
  view_count?: number;
  is_new?: boolean;
  // Optional fields for enhanced table
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  size_sqm?: number | null;
  land_size_sqwah?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  agent_name?: string | null;
  popular_area?: string | null;
  original_price?: number | null;
  original_rental_price?: number | null;
  total_units?: number;
  sold_units?: number;
}

interface PropertiesTableProps {
  data: PropertyTableData[];
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

export function PropertiesTable({ data }: PropertiesTableProps) {
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

  const blockedCount = useMemo(() => {
    return Array.from(selectedIds).filter((id) => {
      const p = data.find((item) => item.id === id);
      return p?.status === "SOLD" || p?.status === "RENTED";
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

  if (data.length === 0) {
    return <PropertiesEmptyState />;
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkDeletePropertiesAction(ids);
    if (result.success) {
      toast.success(result.message);
      clearSelection();
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
        entityName="ทรัพย์"
        confirmMessage={confirmMessage}
        actionableCount={selectedCount - blockedCount}
      />

      <div className="rounded-md border border-gray-200 shadow-sm bg-card overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              {/* Rest of the table header content ... */}
              <TableRow className="bg-muted/50 hover:bg-muted/50 ">
                <TableHead className="w-[50px]">
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
                <TableHead className="w-[320px]">
                  <SortableHead label="ทรัพย์สิน" sortKey="created_at" />
                </TableHead>
                <TableHead className="w-[120px]">
                  <SortableHead label="ประเภท" sortKey="property_type" />
                </TableHead>
                <TableHead className="w-[180px]">ทำเล/ขนาด</TableHead>
                <TableHead className="w-[140px]">
                  <SortableHead label="ราคา" sortKey="price" />
                </TableHead>
                <TableHead className="w-[120px]">ความสนใจ</TableHead>
                <TableHead className="w-[140px]">
                  <SortableHead label="อัปเดต" sortKey="updated_at" />
                </TableHead>
                <TableHead className="w-[200px]">
                  ผู้ซื้อ/ผู้เช่า/ผู้ดูแล
                </TableHead>
                <TableHead className="w-[140px]">
                  <SortableHead label="สถานะ" sortKey="status" />
                </TableHead>
                <TableHead className="w-[100px]">สัญญา</TableHead>
                <TableHead className="w-[100px] text-right pr-4">
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
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={isSelected(property.id)}
                      onCheckedChange={() => toggleSelect(property.id)}
                      aria-label={`เลือก ${property.title}`}
                    />
                  </TableCell>
                  {/* PROPERTY NAME & COVER */}
                  <TableCell>
                    <div className="flex items-start gap-4">
                      <div className="relative h-[80px] w-[100px] shrink-0 overflow-hidden rounded-lg  bg-slate-100 group/image cursor-zoom-in">
                        {property.image_url ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="w-full h-full overflow-hidden relative">
                                <Image
                                  src={property.image_url}
                                  alt={property.title || "Property"}
                                  fill
                                  sizes="100px"
                                  className="object-cover transition-transform duration-300 group-hover/image:scale-110"
                                />
                              </div>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
                              <VisuallyHidden>
                                <DialogTitle>
                                  {property.title || "Property Image"}
                                </DialogTitle>
                              </VisuallyHidden>
                              <div className="relative w-full h-[80vh] flex items-center justify-center bg-transparent">
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
                            <ImageIcon className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                        {property.is_new && (
                          <Badge className="absolute top-1 left-1 h-5 px-1.5 text-[10px] bg-blue-500 hover:bg-blue-600 border-0 pointer-events-none shadow-sm">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 w-72">
                        <Link
                          href={`/protected/properties/${property.id}`}
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-sm"
                        >
                          {property.title || "ไม่ระบุชื่อ"}
                        </Link>
                        <span className="text-xs text-slate-500 line-clamp-1">
                          {property.popular_area || property.description || "-"}
                        </span>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(
                              new Date(property.created_at),
                              {
                                addSuffix: true,
                                locale: th,
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* TYPE */}
                  <TableCell>
                    <div className="flex flex-col items-start gap-1.5">
                      <PropertyTypeBadge type={property.property_type} />
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {property.listing_type === "SALE"
                          ? "ขาย"
                          : property.listing_type === "RENT"
                            ? "เช่า"
                            : "ขาย/เช่า"}
                      </span>
                    </div>
                  </TableCell>

                  {/* LOCATION & ASSET INFO */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-xs text-slate-700">
                        {property.popular_area ||
                          property.subdistrict ||
                          property.district ||
                          "-"}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        {property.size_sqm ? (
                          <span>{property.size_sqm} ตร.ม.</span>
                        ) : null}
                        {property.land_size_sqwah ? (
                          <span>{property.land_size_sqwah} ตร.ว.</span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-slate-400 flex gap-2">
                        {property.bedrooms ? (
                          <span>{property.bedrooms} นอน</span>
                        ) : null}
                        {property.bathrooms ? (
                          <span>{property.bathrooms} น้ำ</span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  {/* PRICE */}
                  <TableCell>
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
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-700"
                        title="จำนวนผู้สนใจ (Leads)"
                      >
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        <span>{property.leads_count} คน</span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 text-[10px] text-slate-400"
                        title="ยอดเข้าชม (Views)"
                      >
                        <Eye className="h-3 w-3" />
                        <span>{property.view_count || 0}</span>
                      </div>
                      {/* Stock Display */}
                      {(property.total_units || 0) > 1 && (
                        <div className="flex items-center gap-1.5 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full w-fit border border-slate-200">
                          <span
                            className={cn(
                              "font-medium",
                              (property.total_units || 0) -
                                (property.sold_units || 0) >
                                0
                                ? "text-emerald-600"
                                : "text-red-500",
                            )}
                          >
                            ยูนิตเหลือ{" "}
                            {(property.total_units || 0) -
                              (property.sold_units || 0)}
                          </span>
                          <span className="text-slate-400">
                            / {property.total_units}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* UPDATED */}
                  <TableCell className="items-center ">
                    <div
                      className="text-xs text-slate-500 line-clamp-1 max-w-[100px] text-ellipsis"
                      title={new Date(property.updated_at).toLocaleString(
                        "th-TH",
                      )}
                    >
                      {formatDistanceToNow(new Date(property.updated_at), {
                        addSuffix: true,
                        locale: th,
                      })}
                    </div>
                  </TableCell>

                  {/* BUYER / TENANT / AGENT */}
                  <TableCell className="items-center ">
                    {property.status === "SOLD" ||
                    property.status === "RENTED" ? (
                      property.closed_lead_name ? (
                        <Link
                          href={`/protected/leads?stage=CLOSED`}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                          title="ดู Leads ที่ปิดดีล"
                        >
                          {property.status === "SOLD" ? "ผู้ซื้อ:" : "ผู้เช่า:"}
                          <span className="max-w-[80px] truncate">
                            {property.closed_lead_name}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          (ปิดดีลแล้ว)
                        </span>
                      )
                    ) : (
                      /* Show Assigned Agent if available (mock/placeholder) */
                      <div className="text-xs text-slate-500">
                        <span className="text-[10px] text-slate-400 block mb-0.5">
                          ผู้ดูแล:
                        </span>
                        <span className="font-medium text-blue-600">
                          {property.agent_name || "คุณ (Me)"}
                        </span>
                      </div>
                    )}
                  </TableCell>

                  {/* STATUS */}
                  <TableCell>
                    <PropertyStatusSelect
                      id={property.id}
                      value={property.status as PropertyStatus}
                    />
                  </TableCell>

                  {/* EXPIRY (MOCK) */}
                  <TableCell>
                    <span className="text-xs text-slate-400">-</span>
                  </TableCell>

                  {/* ACTIONS */}
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer  hover:text-blue-700 hover:bg-blue-50"
                        title="ดู"
                        aria-label="ดู"
                      >
                        <Link href={`/protected/properties/${property.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer  hover:text-amber-700 hover:bg-amber-50"
                        title="แก้ไข"
                        aria-label="แก้ไข"
                      >
                        <Link
                          href={`/protected/properties/${property.id}/edit`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                      </Button>

                      <DuplicatePropertyButton
                        id={property.id}
                        className="cursor-pointer hover:text-purple-600 hover:bg-purple-50"
                      />

                      {/* delete อยู่ในนี้ */}
                      <PropertyRowActions id={property.id} />
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
                  "relative group bg-white dark:bg-slate-900 rounded-xl border transition-all duration-300 shadow-sm hover:shadow-md",
                  isSelected(property.id)
                    ? "border-blue-500 dark:border-blue-600 ring-1 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800",
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
                    <PropertyRowActions id={property.id} />
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
                        className="h-5 text-[10px] px-2 bg-white/90 backdrop-blur-sm shadow-sm border-none font-medium text-white"
                      />
                      {property.is_new && (
                        <Badge className="h-5 text-[10px] px-2 bg-blue-600 text-white border-none shadow-sm font-bold">
                          NEW
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Property Details */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <Link
                        href={`/protected/properties/${property.id}`}
                        className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-1 hover:text-blue-600 transition-colors"
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

                  <div className="py-2.5 border-y border-slate-100 dark:border-slate-800">
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
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        {property.leads_count}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        {property.view_count || 0}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <PropertyStatusSelect
                        id={property.id}
                        value={property.status as PropertyStatus}
                        className="h-7 w-26 text-[10px] font-bold shadow-xs transition-shadow hover:shadow-md"
                      />
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <span className="text-[10px] text-slate-400 font-medium">
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
