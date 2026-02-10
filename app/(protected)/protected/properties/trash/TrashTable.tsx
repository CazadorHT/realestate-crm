"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Property } from "@/lib/types/property";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { TrashRowActions } from "./TrashRowActions";
import { Badge } from "@/components/ui/badge";
import { PROPERTY_TYPE_LABELS } from "@/features/properties/labels";
import { TrashIcon } from "lucide-react";

interface TrashTableProps {
  data: Property[];
}

export function TrashTable({ data }: TrashTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-slate-200 rounded-lg bg-muted/10 h-[400px]">
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <TrashIcon className="w-12 h-12 text-slate-400" />
        </div>
        <p className="text-muted-foreground">ไม่มีรายการในถังขยะ</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>รูปภาพ</TableHead>
            <TableHead>ชื่อทรัพย์</TableHead>
            <TableHead>ราคา</TableHead>
            <TableHead>ทำเล</TableHead>
            <TableHead>ประเภท</TableHead>
            <TableHead>วันที่ลบ</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((property) => (
            <TableRow key={property.id}>
              <TableCell>
                <div className="h-12 w-20 bg-muted rounded-md overflow-hidden relative border border-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-50 text-[10px] text-gray-400 font-medium">
                      ไม่มีรูป
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[300px] truncate" title={property.title}>
                  {property.title}
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
                      return <span className="text-sm text-slate-300">-</span>;
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
              <TableCell>
                <div className="text-sm">
                  {[property.district, property.province]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {PROPERTY_TYPE_LABELS[property.property_type] ||
                    property.property_type}
                </Badge>
              </TableCell>
              <TableCell>
                {property.deleted_at
                  ? format(new Date(property.deleted_at), "dd MMM yyyy HH:mm", {
                      locale: th,
                    })
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                <TrashRowActions id={property.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
