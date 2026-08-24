"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { PopularAreaForm } from "./PopularAreaForm";
import { updatePopularArea } from "../popular-areas-actions";
import { Edit, MapPin } from "lucide-react";
import { type PopularArea } from "./PopularAreasTable";
import { useLanguage } from "@/lib/i18n/language-context";

interface EditPopularAreaDialogProps {
  area: PopularArea | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPopularAreaDialog({
  area,
  open,
  onOpenChange,
  onSuccess,
}: EditPopularAreaDialogProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      className="p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl md:max-w-3xl"
      title={
        <div className="flex items-center gap-3 mt-6 px-4 text-left">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-100/50 shadow-xs text-blue-600">
            <Edit className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              {isEn ? "Edit Popular Area" : "แก้ไขข้อมูลทำเล"}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5 ml-0.5">
              {isEn ? "Edit Location Details & SEO" : "แก้ไขข้อมูลทำเลและ SEO"}
            </span>
          </div>
        </div>
      }
      description={
        <div className="px-5 mt-1 flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded shadow-sm">
            ID: {area?.id?.substring(0, 8)}...
          </span>
          <MapPin className="h-3 w-3 text-slate-300" />
          <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
            {isEn ? (area?.name_en || area?.name) : (area?.name_en ? `${area?.name} (${area?.name_en})` : area?.name)}
          </span>
        </div>
      }
    >
      <div className="p-6 bg-white rounded-b-2xl">
        {area && (
          <PopularAreaForm
            initialData={area}
            onSuccess={() => {
              onOpenChange(false);
              onSuccess();
            }}
            onCancel={() => onOpenChange(false)}
            saveAction={(values) => updatePopularArea(area.id, values)}
          />
        )}
      </div>
    </ResponsiveDialog>
  );
}

