"use client";

import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { PartnerForm } from "./PartnerForm";
import { Edit, Handshake } from "lucide-react";

interface EditPartnerDialogProps {
  partner: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditPartnerDialog({
  partner,
  open,
  onOpenChange,
  onSuccess,
}: EditPartnerDialogProps) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      className="p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl rounded-2xl md:max-w-2xl"
      title={
        <div className="flex items-center gap-3 mt-6 px-4 text-left">
          <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-100/50 shadow-xs text-rose-600">
            <Edit className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
              แก้ไขข้อมูลช่องทางการตลาด
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5 ml-0.5">
              Edit Marketing Channel
            </span>
          </div>
        </div>
      }
      description={
        <div className="px-5 mt-1 flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded shadow-sm">
            ID: {partner?.id?.substring(0, 8)}...
          </span>
          <Handshake className="h-3 w-3 text-slate-300" />
          <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">
            {partner?.name}
          </span>
        </div>
      }
    >
      <div className="p-6 bg-white rounded-b-2xl">
        {partner && (
          <PartnerForm
            initialData={partner}
            onSuccess={() => {
              onOpenChange(false);
              onSuccess();
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </div>
    </ResponsiveDialog>
  );
}
