"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, RefreshCcw, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ServiceRow } from "@/features/services/actions";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/language-context";

interface ServicesTableMobileProps {
  services: ServiceRow[];
  isTrashView: boolean;
  isPending: boolean;
  onEdit: (service: ServiceRow) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export function ServicesTableMobile({
  services,
  isTrashView,
  isPending,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
}: ServicesTableMobileProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
      {services.length === 0 ? (
        <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400">
          {isTrashView ? (isEn ? "No items in trash" : "ไม่พบข้อมูลในถังขยะ") : (isEn ? "No services created yet" : "ไม่พบข้อมูลบริการ")}
        </div>
      ) : (
        services.map((service) => (
          <div
            key={service.id}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 active:scale-[0.98] transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="h-16 w-24 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                {(service as any).cover_image ? (
                  <Image
                    src={(service as any).cover_image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                    fill
                    sizes="96px"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">
                    {isEn ? "No Image" : "ไม่มีรูปภาพ"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {isEn ? "Status" : "สถานะ"}
                  </span>
                  {service.is_active ? (
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 h-5 text-[10px] font-black">
                      {isEn ? "Active" : "เปิดใช้งาน"}
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-50 text-slate-400 border-none px-2 h-5 text-[10px] font-black">
                      {isEn ? "Hidden" : "ซ่อน"}
                    </Badge>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 mt-1 truncate">
                  {service.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    /{service.slug}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Eye className="w-2.5 h-2.5" />
                    {(service as any).view_count || 0}
                  </div>
                  {service.gallery_images &&
                    service.gallery_images.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
                        <ImageIcon className="w-2.5 h-2.5" />+
                        {service.gallery_images.length}
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  {isEn ? "Price Range" : "ช่วงราคา"}
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  {service.price_range || (isEn ? "Contact for price" : "สอบถามราคา")}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isTrashView ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-3 text-xs border-slate-200 text-slate-600 cursor-pointer"
                      onClick={() => onEdit(service)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-2" />
                      {isEn ? "Edit" : "แก้ไข"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-3 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                      onClick={() => onDelete(service.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      {isEn ? "Trash" : "ย้ายลงถังขยะ"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="h-9 px-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      onClick={() => onRestore(service.id)}
                      disabled={isPending}
                    >
                      <RefreshCcw
                        className={cn(
                          "w-3.5 h-3.5 mr-2",
                          isPending && "animate-spin",
                        )}
                      />
                      {isEn ? "Restore" : "กู้คืน"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-rose-700 border-rose-100 bg-rose-50/50 hover:bg-rose-50 rounded-xl cursor-pointer"
                      onClick={() => onPermanentDelete(service.id)}
                      title={isEn ? "Delete Permanently" : "ลบถาวร"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

