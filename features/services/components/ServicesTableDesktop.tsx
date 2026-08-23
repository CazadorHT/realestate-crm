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
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCcw,
  TrendingUp,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ServiceRow } from "@/features/services/actions";
import { useServicesActions } from "@/features/services/hooks/useServicesActions";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n/language-context";

interface ServicesTableDesktopProps {
  services: ServiceRow[];
  isTrashView: boolean;
  isPending: boolean;
  onEdit: (service: ServiceRow) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export function ServicesTableDesktop({
  services,
  isTrashView,
  isPending,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
}: ServicesTableDesktopProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="hidden lg:block rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm transition-all duration-300">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[80px] text-center font-bold text-slate-800">
              #
            </TableHead>
            <TableHead className="font-bold text-slate-800">
              {isEn ? "Service Details" : "ข้อมูลบริการ"}
            </TableHead>
            <TableHead className="w-[140px] text-right font-bold text-slate-800">
              {isEn ? "Starting Price" : "ราคาเริ่มต้น"}
            </TableHead>
            <TableHead className="w-[120px] text-center font-bold text-slate-800">
              {isEn ? "Views" : "สถิติยอดวิว"}
            </TableHead>
            <TableHead className="w-[120px] text-center font-bold text-slate-800">
              {isEn ? "Status" : "สถานะ"}
            </TableHead>
            <TableHead className="w-[100px] text-right font-bold text-slate-800">
              {isEn ? "Actions" : "จัดการ"}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-48 text-center text-slate-400"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-slate-50 rounded-full">
                    <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
                  </div>
                  <p className="text-sm font-medium">
                    {isTrashView
                      ? (isEn ? "No items in trash" : "ไม่พบข้อมูลในถังขยะ")
                      : (isEn ? "No services created yet" : "ยังไม่มีข้อมูลบริการ")}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            services.map((service) => (
              <TableRow
                key={service.id}
                className="group hover:bg-slate-50/10 transition-colors"
              >
                <TableCell className="text-center text-slate-300 font-mono text-[10px]">
                  {service.sort_order}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-20 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-sm">
                      {(service as any).cover_image ? (
                        <Image
                          src={(service as any).cover_image}
                          alt={service.title}
                          className="w-full h-full object-cover"
                          fill
                          sizes="80px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] text-center p-1">
                          {isEn ? "No Image" : "ไม่มีรูปภาพ"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 leading-tight truncate">
                        {service.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-[10px] text-slate-400 font-mono truncate bg-slate-50 w-fit px-1.5 rounded">
                          /{service.slug}
                        </div>
                        {service.gallery_images &&
                          service.gallery_images.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] h-4 px-1 border-slate-200 text-slate-400 bg-slate-50/50"
                            >
                              +{service.gallery_images.length} {isEn ? "imgs" : "imgs"}
                            </Badge>
                          )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm text-slate-600 font-bold">
                    {service.price_range || (isEn ? "Contact for price" : "สอบถามราคา")}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all",
                        ((service as any).view_count || 0) > 100
                          ? "bg-green-50 text-green-600 border border-green-100"
                          : "text-slate-400",
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {(service as any).view_count || 0}
                      {((service as any).view_count || 0) > 100 && (
                        <TrendingUp className="w-3 h-3 ml-0.5" />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {service.is_active ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100 whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> {isEn ? "Active" : "เปิดใช้งาน"}
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-100 whitespace-nowrap"
                    >
                      <EyeOff className="w-3.5 h-3.5 mr-1.5" /> {isEn ? "Hidden" : "ซ่อน"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right pr-6">
                  {isTrashView ? (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-emerald-600 hover:bg-emerald-50/50 rounded-xl transition-all cursor-pointer"
                        onClick={() => onRestore(service.id)}
                        disabled={isPending}
                        title={isEn ? "Restore" : "กู้คืนข้อมูล"}
                      >
                        <RefreshCcw
                          className={cn(
                            "h-4.5 w-4.5",
                            isPending && "animate-spin",
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer"
                        onClick={() => onPermanentDelete!(service.id)}
                        disabled={isPending}
                        title={isEn ? "Delete Permanently" : "ลบทิ้งถาวร"}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(service)} className="cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          <span>{isEn ? "Edit" : "แก้ไข"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(service.id)}
                          className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          <span>{isEn ? "Move to Trash" : "ย้ายลงถังขยะ"}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
