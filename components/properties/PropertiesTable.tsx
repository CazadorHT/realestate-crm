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
import type { PropertyStatus } from "@/features/properties/types";
import { Button } from "@/components/ui/button";
import { Eye, Edit3 } from "lucide-react";
import { DuplicatePropertyButton } from "./DuplicatePropertyButton";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface PropertyTableData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  property_type: string;
  listing_type: string;
  price: number | null;
  rental_price: number | null;
  status: PropertyStatus;
  leads_count: number;
  updated_at: string;
  created_at: string;
  closed_lead_name: string | null;
  is_hot?: boolean;
  is_new?: boolean;
}

interface PropertiesTableProps {
  data: PropertyTableData[];
}
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

  return (
    <div className="rounded-md border shadow-sm bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[300px]">
              <SortableHead label="ทรัพย์สิน" sortKey="created_at" />
            </TableHead>
            <TableHead>
              <SortableHead label="ประเภท/เงื่อนไข" sortKey="property_type" />
            </TableHead>
            <TableHead>
              <SortableHead label="ราคา" sortKey="price" />
            </TableHead>
            <TableHead className="w-[140px]">
              <SortableHead label="อัปเดตล่าสุด" sortKey="updated_at" />
            </TableHead>
            <TableHead className="w-[220px]">ผู้ซื้อ/ผู้เช่า</TableHead>
          
            <TableHead>
              <SortableHead label="สถานะ" sortKey="status" />
            </TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((property) => (
            <TableRow key={property.id} className="group hover:bg-muted/5">
              {/* PROPERTY NAME & COVER */}
              <TableCell>
                <div className="flex items-start gap-4">
                  <div className="relative h-[150px] w-[250px] flex-shrink-0 overflow-hidden rounded-md border bg-muted group/image cursor-zoom-in">
                    {property.image_url ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="w-full h-full overflow-hidden">
                            <img
                              src={property.image_url}
                              alt={property.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-125"
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
                            className="max-h-[80vh] w-auto rounded-lg object-contain"
                          />
                        </DialogContent>
                        
                      </Dialog>
                      
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    {property.is_new && (
                      <Badge className="absolute top-1 left-1 h-5 px-1.5 text-[10px] bg-blue-500 hover:bg-blue-600 border-0 pointer-events-none">
                        NEW
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/protected/properties/${property.id}`}
                      className="font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {property.title || "ไม่ระบุชื่อ"}
                    </Link>
                    <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">
                      {property.description || "ไม่มีรายละเอียดทำเล"}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    เพิ่มเมื่อ{" "}
                    {formatDistanceToNow(new Date(property.created_at), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </span>
                      </div>
                  </div>
                </div>
              </TableCell>

              {/* TYPE & LISTING */}
              <TableCell>
                <div className="flex flex-col items-start gap-2">
                  <PropertyTypeBadge type={property.property_type} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {property.listing_type === "SALE"
                      ? "ขาย"
                      : property.listing_type === "RENT"
                      ? "เช่า"
                      : "ขาย/เช่า"}
                  </span>
                </div>
              </TableCell>

              {/* PRICE */}
              <TableCell>
                <div className="flex flex-col gap-1">
                  {property.listing_type !== "RENT" && property.price && (
                    <span className="font-semibold text-sm">
                      ฿{property.price.toLocaleString()}
                    </span>
                  )}
                  {property.listing_type !== "SALE" &&
                    property.rental_price && (
                      <span className="text-xs text-muted-foreground">
                        เช่า: ฿{property.rental_price.toLocaleString()}/ด
                      </span>
                    )}
                  {!property.price && !property.rental_price && (
                    <span className="text-sm">-</span>
                  )}
                </div>
              </TableCell>
              {/* UPDATED */}
              <TableCell className="align-top">
                <div
                  className="text-xs text-muted-foreground"
                  title={new Date(property.updated_at).toLocaleString("th-TH")}
                >
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    แก้ไขล่าสุดเมื่อ{" "}
                    {formatDistanceToNow(new Date(property.updated_at), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </span>
                </div>
              </TableCell>
              {/* BUYER / TENANT */}
              <TableCell className="align-top">
                {property.status === "SOLD" || property.status === "RENTED" ? (
                  property.closed_lead_name ? (
                    <Link
                      href={`/protected/leads?stage=CLOSED`}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                      title="ดู Leads ที่ปิดดีล"
                    >
                      {property.status === "SOLD" ? "ผู้ซื้อ:" : "ผู้เช่า:"}
                      <span className="max-w-[140px] truncate">
                        {property.closed_lead_name}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      ปิดดีลแล้ว (ยังไม่ระบุชื่อ)
                    </span>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              {/* STATUS */}
              <TableCell>
                <PropertyStatusSelect
                  id={property.id}
                  value={property.status as PropertyStatus}
                />
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
  );
}
