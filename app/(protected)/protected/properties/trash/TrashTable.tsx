"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Property } from "@/lib/types/property";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { TrashRowActions } from "./TrashRowActions";
import { Badge } from "@/components/ui/badge";
import { PROPERTY_TYPE_LABELS } from "@/features/properties/labels";
import { TrashIcon } from "lucide-react";

import { PaginationControls } from "@/components/ui/pagination-controls";

import { useLanguage } from "@/components/providers/LanguageProvider";

// ขยาย Type Property เพื่อให้รองรับฟิลด์ที่อาจจะตกหล่นใน lib/types/property
type ExtendedProperty = Property & {
  original_price?: number | null;
  original_rental_price?: number | null;
  creator_name?: string | null;
};

interface TrashTableProps {
  data: Property[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  showCreator?: boolean;
}

export function TrashTable({
  data,
  totalCount,
  pageSize,
  currentPage,
  showCreator = true,
}: TrashTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  if (data.length === 0 && totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-slate-200 rounded-lg bg-muted/10 h-[400px]">
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <TrashIcon className="w-12 h-12 text-slate-400" />
        </div>
        <p className="text-muted-foreground">
          {isEn ? "No items in trash" : "ไม่มีรายการในถังขยะ"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isEn ? "Image" : "รูปภาพ"}</TableHead>
            <TableHead>{isEn ? "Title" : "ชื่อทรัพย์"}</TableHead>
            <TableHead>{isEn ? "Price" : "ราคา"}</TableHead>
            <TableHead>{isEn ? "Location" : "ทำเล"}</TableHead>
            <TableHead>{isEn ? "Type" : "ประเภท"}</TableHead>
            {showCreator && <TableHead>{isEn ? "Creator" : "ผู้สร้าง"}</TableHead>}
            <TableHead>{isEn ? "Deleted Date" : "วันที่ลบ"}</TableHead>
            <TableHead className="text-right">{isEn ? "Actions" : "จัดการ"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((propertyItem, index) => {
            const property = propertyItem as ExtendedProperty;

            return (
              <TableRow key={property.id || index}>
                <TableCell>
                  <div className="h-12 w-20 bg-muted rounded-md overflow-hidden relative border border-slate-100">
                    {Array.isArray(property.images) && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title ?? (isEn ? "Property image" : "รูปภาพทรัพย์")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-50 text-[10px] text-gray-400 font-medium">
                        {isEn ? "No image" : "ไม่มีรูป"}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className="max-w-[300px] truncate font-medium text-slate-900"
                    title={property.title ?? undefined}
                  >
                    {property.title || (isEn ? "Untitled" : "ไม่ระบุชื่อ")}
                  </div>
                </TableCell>
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
                                      {isEn ? "Sale Disc" : "ลดขาย"}
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
                                    ฿{originalRentPrice?.toLocaleString()}{isEn ? "/mo" : "/ด"}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-orange-500 font-medium">
                                      {isEn ? "Rent Disc" : "ลดเช่า"}
                                    </span>
                                    <span className="font-bold text-sm text-orange-600">
                                      ฿{rentPrice?.toLocaleString()}{isEn ? "/mo" : "/ด"}
                                    </span>
                                  </div>
                                </div>
                              ) : rentPrice ? (
                                <span className="text-xs font-semibold text-blue-600">
                                  {isEn ? "Rent: " : "เช่า: "}฿{rentPrice.toLocaleString()}{isEn ? "/mo" : "/ด"}
                                </span>
                              ) : originalRentPrice ? (
                                <span className="text-xs font-semibold text-blue-600">
                                  {isEn ? "Rent: " : "เช่า: "}฿{originalRentPrice.toLocaleString()}{isEn ? "/mo" : "/ด"}
                                </span>
                              ) : null}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {[property.district, property.province]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {property.property_type
                      ? (PROPERTY_TYPE_LABELS as any)[property.property_type]?.[isEn ? "en" : "th"] ||
                        (PROPERTY_TYPE_LABELS as any)[property.property_type]?.en ||
                        property.property_type
                      : "-"}
                  </Badge>
                </TableCell>
                {showCreator && (
                  <TableCell>
                    <div
                      className="text-sm font-medium text-slate-600 max-w-[150px] truncate"
                      title={property.creator_name ?? undefined}
                    >
                      {property.creator_name || "-"}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  {property.deleted_at
                    ? format(
                        new Date(property.deleted_at),
                        "dd MMM yyyy HH:mm",
                        isEn ? undefined : { locale: th },
                      )
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {property.id ? <TrashRowActions id={property.id} /> : "-"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {data.length === 0 && totalCount > 0 && (
        <div className="py-10 text-center text-sm text-slate-400 border-t border-slate-100">
          {isEn ? "No items found on this page" : "ไม่พบข้อมูลในหน้านี้"}
        </div>
      )}

      <PaginationControls
        totalCount={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
      />
    </div>
  );
}
