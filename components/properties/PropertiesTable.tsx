"use client";

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
import { PropertiesEmptyState } from "./PropertiesEmptyState";
import { PropertyStatusSelect } from "./PropertyStatusDropdown";
import type {
  PropertyStatus,
  PropertyType,
  ListingType,
} from "@/features/properties/types";
import { Button } from "@/components/ui/button";
import { Eye, Edit3 } from "lucide-react";
import { DuplicatePropertyButton } from "./DuplicatePropertyButton";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";

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
  if (data.length === 0) {
    return <PropertiesEmptyState />;
  }

  const handleExport = () => {
    // CSV Export Logic
    const headers = [
      "ID",
      "Title",
      "Type",
      "Listing Type",
      "Price",
      "Rent",
      "Status",
      "Leads",
      "Created At",
    ];

    const rows = data.map((p) => [
      p.id,
      p.title.replace(/"/g, '""'), // escape quotes
      p.property_type,
      p.listing_type,
      p.price || 0,
      p.rental_price || 0,
      p.status,
      p.leads_count,
      p.created_at,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `properties_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="rounded-md border shadow-sm bg-card">
        <Table>
          <TableHeader>
            {/* Rest of the table header content ... */}
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[300px]">
                <SortableHead label="ทรัพย์สิน" sortKey="created_at" />
              </TableHead>
              <TableHead>
                <SortableHead label="ประเภท" sortKey="property_type" />
              </TableHead>
              <TableHead>ทำเล/ขนาด</TableHead>
              <TableHead>
                <SortableHead label="ราคา" sortKey="price" />
              </TableHead>
              <TableHead>ความสนใจ</TableHead>
              <TableHead className="w-[140px]">
                <SortableHead label="อัปเดต" sortKey="updated_at" />
              </TableHead>
              <TableHead className="w-[200px]">
                ผู้ซื้อ/ผู้เช่า/ผู้ดูแล
              </TableHead>

              <TableHead>
                <SortableHead label="สถานะ" sortKey="status" />
              </TableHead>
              <TableHead>สัญญา</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((property) => (
              <TableRow
                key={property.id}
                className="group hover:bg-slate-50/50"
              >
                {/* PROPERTY NAME & COVER */}
                <TableCell>
                  <div className="flex items-start gap-4">
                    <div className="relative h-[80px] w-[120px] flex-shrink-0 overflow-hidden rounded-lg border bg-slate-100 group/image cursor-zoom-in">
                      {property.image_url ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="w-full h-full overflow-hidden">
                              <img
                                src={property.image_url}
                                alt={property.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                              />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
                            <VisuallyHidden>
                              <DialogTitle>{property.title}</DialogTitle>
                            </VisuallyHidden>
                            <img
                              src={property.image_url}
                              alt={property.title}
                              className="max-h-[80vh] w-auto rounded-lg object-contain shadow-2xl"
                            />
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
                    <div className="flex flex-col gap-1 min-w-0">
                      <Link
                        href={`/protected/properties/${property.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 text-sm"
                      >
                        {property.title || "ไม่ระบุชื่อ"}
                      </Link>
                      <span className="text-xs text-slate-500 line-clamp-1">
                        {property.popular_area || property.description || "-"}
                      </span>
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(property.created_at), {
                            addSuffix: true,
                            locale: th,
                          })}
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
                  <div className="flex flex-col gap-1">
                    {(() => {
                      const isSale =
                        property.listing_type === "SALE" ||
                        property.listing_type === "SALE_AND_RENT";
                      const isRent =
                        property.listing_type === "RENT" ||
                        property.listing_type === "SALE_AND_RENT";

                      const salePrice = property.price;
                      const originalSalePrice = property.original_price;
                      const hasSaleDiscount =
                        originalSalePrice &&
                        salePrice &&
                        originalSalePrice > salePrice;

                      const rentPrice = property.rental_price;
                      const originalRentPrice = property.original_rental_price;
                      const hasRentDiscount =
                        originalRentPrice &&
                        rentPrice &&
                        originalRentPrice > rentPrice;

                      if (
                        !salePrice &&
                        !rentPrice &&
                        !originalSalePrice &&
                        !originalRentPrice
                      ) {
                        return (
                          <span className="text-sm text-slate-300">-</span>
                        );
                      }

                      return (
                        <>
                          {/* Sale Price */}
                          {isSale && (
                            <>
                              {hasSaleDiscount ? (
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="text-xs text-slate-400 line-through decoration-slate-300">
                                    ฿{originalSalePrice?.toLocaleString()}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-red-500 font-medium">
                                      ลดขาย
                                    </span>
                                    <span className="font-bold text-sm text-red-600">
                                      ฿{salePrice?.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ) : salePrice ? (
                                <span className="font-bold text-sm text-emerald-600">
                                  ฿{salePrice.toLocaleString()}
                                </span>
                              ) : originalSalePrice ? (
                                <span className="font-bold text-sm text-emerald-600">
                                  ฿{originalSalePrice.toLocaleString()}
                                </span>
                              ) : null}
                            </>
                          )}

                          {/* Rent Price */}
                          {isRent && (
                            <>
                              {hasRentDiscount ? (
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="text-xs text-slate-400 line-through decoration-slate-300">
                                    ฿{originalRentPrice?.toLocaleString()}/ด
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-orange-500 font-medium">
                                      ลดเช่า
                                    </span>
                                    <span className="font-bold text-sm text-orange-600">
                                      ฿{rentPrice?.toLocaleString()}/ด
                                    </span>
                                  </div>
                                </div>
                              ) : rentPrice ? (
                                <span className="text-xs font-semibold text-blue-600">
                                  เช่า: ฿{rentPrice.toLocaleString()}/ด
                                </span>
                              ) : originalRentPrice ? (
                                <span className="text-xs font-semibold text-blue-600">
                                  เช่า: ฿{originalRentPrice.toLocaleString()}/ด
                                </span>
                              ) : null}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </TableCell>

                {/* INTEREST */}
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
                      {/* Mock views for now */}
                      <span>{Math.floor(Math.random() * 500) + 10}</span>
                    </div>
                  </div>
                </TableCell>

                {/* UPDATED */}
                <TableCell className="align-top">
                  <div
                    className="text-xs text-slate-500"
                    title={new Date(property.updated_at).toLocaleString(
                      "th-TH"
                    )}
                  >
                    {formatDistanceToNow(new Date(property.updated_at), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </div>
                </TableCell>

                {/* BUYER / TENANT / AGENT */}
                <TableCell className="align-top">
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
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="แก้ไข"
                      aria-label="แก้ไข"
                    >
                      <Link href={`/protected/properties/${property.id}/edit`}>
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    </Button>

                    <DuplicatePropertyButton
                      id={property.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
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
    </div>
  );
}
