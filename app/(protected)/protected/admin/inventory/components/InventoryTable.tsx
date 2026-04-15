"use client";

import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Building2, Layers, MapPin, Tag, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { InventoryProperty } from "../types";

interface InventoryTableProps {
  data: InventoryProperty[];
  isLoading: boolean;
  onReset: () => void;
}

// 🛡️ Elite Thai Label Mapping
const PROPERTY_TYPE_TH = {
  CONDO: "คอนโด",
  HOUSE: "บ้านเดี่ยว",
  TOWNHOME: "ทาวน์โฮม",
  LAND: "ที่ดิน",
  COMMERCIAL: "อาคารพาณิชย์",
  OFFICE: "ออฟฟิศ",
  WAREHOUSE: "โกดัง",
  OTHER: "อื่นๆ"
};

const LISTING_TYPE_TH = {
  SALE: "ขาย",
  RENT: "เช่า",
  SALE_AND_RENT: "ขาย/เช่า"
};

const STATUS_TH = {
  ACTIVE: "ออนไลน์",
  UNDER_OFFER: "ติดจอง",
  SOLD: "ขายแล้ว",
  RENTED: "เช่าแล้ว",
  WITHDRAWN: "ปิดประกาศ"
};

const STATUS_COLORS = {
  ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white! hover:border-emerald-600",
  UNDER_OFFER: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white! hover:border-amber-600",
  SOLD: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white! hover:border-rose-600",
  RENTED: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white! hover:border-blue-600",
  WITHDRAWN: "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-500 hover:text-white! hover:border-slate-500"
};

// 🛡️ Performance Polish: Memoized to prevent re-renders during search typing
export const InventoryTable = React.memo(({ data, isLoading, onReset }: InventoryTableProps) => {
  
  // 🛡️ Premium Table Skeleton
  const TableSkeleton = () => (
    Array(5).fill(0).map((_, i) => (
      <TableRow key={i} className="animate-pulse">
        <TableCell className="px-6 py-5"><div className="h-10 w-full bg-slate-100 rounded-lg" /></TableCell>
        <TableCell><div className="h-6 w-24 bg-slate-100 rounded-md" /></TableCell>
        <TableCell><div className="h-6 w-20 bg-slate-100 rounded-md" /></TableCell>
        <TableCell><div className="h-8 w-28 bg-slate-100 rounded-md" /></TableCell>
        <TableCell><div className="h-6 w-16 bg-slate-100 rounded-full" /></TableCell>
        <TableCell><div className="h-8 w-8 bg-slate-100 rounded-full ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  // 🛡️ Premium Card Skeleton (Mobile)
  const CardSkeleton = () => (
    Array(3).fill(0).map((_, i) => (
      <div key={i} className="p-4 space-y-4 border-b border-slate-100 animate-pulse">
        <div className="aspect-video w-full bg-slate-100 rounded-xl" />
        <div className="space-y-2">
          <div className="h-5 w-3/4 bg-slate-100 rounded" />
          <div className="h-4 w-1/2 bg-slate-100 rounded" />
        </div>
      </div>
    ))
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-500">
      {/* 🖥️ Desktop View (md+) */}
      <div className="hidden xl:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
              <TableHead className="font-semibold text-slate-500 text-[11px] uppercase tracking-widest px-6 py-5 min-w-[300px]">ข้อมูลทรัพย์สิน</TableHead>
              <TableHead className="font-semibold text-slate-500 text-[11px] uppercase tracking-widest">สาขา</TableHead>
              <TableHead className="font-semibold text-slate-500 text-[11px] uppercase tracking-widest">ประเภท</TableHead>
              <TableHead className="font-semibold text-slate-500 text-[11px] uppercase tracking-widest">การดีล</TableHead>
              <TableHead className="font-semibold text-slate-500 text-[11px] uppercase tracking-widest">ราคา</TableHead>
              <TableHead className="font-semibold text-slate-500 text-[11px] uppercase tracking-widest">สถานะ</TableHead>
              <TableHead className="text-right font-semibold text-slate-500 text-[11px] uppercase tracking-widest px-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : (
              data.map((item) => (
                <TableRow key={item.id} className="group hover:bg-blue-50/30 transition-all border-b border-slate-50 last:border-0 min-h-20">
                  <TableCell className="px-6 whitespace-normal!">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail with Overlays */}
                      <div className="relative h-12 w-20 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                        {item.main_image_url ? (
                          <img 
                            src={item.main_image_url} 
                            alt={item.title} 
                            loading="lazy"
                            className="object-cover h-full w-full group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=200&auto=format&fit=crop';
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                        <div className="absolute top-1 left-1 bg-black/60 text-[8px] font-semibold text-white px-1.5 py-0.5 rounded-sm backdrop-blur-xs uppercase">
                          ID: {item.id.split("-")[0]}
                        </div>
                      </div>
                      <div className="max-w-[500px] ">
                        <div className="font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors text-sm  leading-tight">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium italic">
                          <MapPin className="h-3 w-3" /> แตะเพื่อดูรายละเอียด
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100 font-semibold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                      {item.tenant_name || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-slate-500">
                      {PROPERTY_TYPE_TH[item.property_type as keyof typeof PROPERTY_TYPE_TH] || item.property_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-semibold text-slate-400 border-slate-200">
                      {LISTING_TYPE_TH[item.listing_type as keyof typeof LISTING_TYPE_TH] || item.listing_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-sm">
                        {item.price ? `${item.price.toLocaleString()} ` : "-"}
                        <span className="text-[10px] font-semibold text-slate-400">฿</span>
                      </span>
                      {item.rental_price && (
                        <div className="text-[10px] font-semibold text-emerald-600 uppercase flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5" /> {item.rental_price.toLocaleString()} / ด.
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "font-semibold px-3 py-1 rounded-full text-[9px] uppercase border shadow-2xs transition-all cursor-default",
                      STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.WITHDRAWN
                    )}>
                      {STATUS_TH[item.status as keyof typeof STATUS_TH] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button asChild variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                      <Link href={`/protected/properties/${item.id}`}>
                        <Eye className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 📱 Mobile Card View (<md) */}
      <div className="xl:hidden divide-y grid grid-cols-1 md:grid-cols-2 gap-4 divide-slate-100">
        {isLoading ? (
          <CardSkeleton />
        ) : (
          data.map((item) => (
            <div key={item.id} className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors">
              <Link href={`/protected/properties/${item.id}`} className="block space-y-4 group">
                {/* 🎨 Aspect-Video Thumbnail (Elite Visual) */}
                <div className="relative aspect-video w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-100 shadow-sm">
                  {item.main_image_url ? (
                    <img 
                      src={item.main_image_url} 
                      alt={item.title} 
                      loading="lazy"
                      className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=400&auto=format&fit=crop';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-300">
                      <Building2 className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-black/70 backdrop-blur-md border-none text-[10px] font-semibold uppercase">{item.id.split("-")[0]}</Badge>
                    <Badge className="bg-blue-600 border-none text-[10px] font-semibold uppercase">
                        {PROPERTY_TYPE_TH[item.property_type as keyof typeof PROPERTY_TYPE_TH] || item.property_type}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-slate-100">
                    <span className="text-xs font-semibold text-slate-900">
                      {item.price ? `${item.price.toLocaleString()} ฿` : "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-semibold text-slate-800 text-lg line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Building2 className="h-3.5 w-3.5" />
                      {item.tenant_name}
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-semibold uppercase border transition-all",
                      STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.WITHDRAWN
                    )}>
                      {STATUS_TH[item.status as keyof typeof STATUS_TH] || item.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* 📭 Premium Empty State */}
      {!isLoading && data.length === 0 && (
        <div className="py-24 text-center space-y-6">
          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            <div className="p-6 bg-slate-50 rounded-full">
              <Layers className="h-12 w-12 text-slate-200" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-800 italic">"ยอดเขาที่ว่างเปล่า..."</h3>
              <p className="text-sm text-slate-400 font-medium">
                ดูเหมือนว่าเงื่อนไขการค้นหาของคุณจะละเอียดเกินไปจนไม่พบทรัพย์สินที่ต้องการ
              </p>
            </div>
            <Button 
                variant="outline" 
                onClick={onReset}
                className="rounded-xl px-8 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all font-semibold"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              ล้างตัวกรองและเริ่มใหม่
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

InventoryTable.displayName = "InventoryTable";
