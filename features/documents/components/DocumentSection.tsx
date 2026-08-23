"use client";

import { useState } from "react";
import { DocumentOwnerType } from "../schema";
import { DocumentList } from "./DocumentList";
import { DocumentUpload } from "./DocumentUpload";
import { TemplateDialog } from "./TemplateDialog";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Wand2 } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Props = {
  ownerId: string;
  ownerType: DocumentOwnerType;
  tenantId?: string | null;
};

export function DocumentSection({ ownerId, ownerType, tenantId }: Props) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-teal-900/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-50 bg-slate-50/20">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-100 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 tracking-tight">
              {isEn ? "Documents" : "เอกสาร"}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {isEn ? "Manage related files and contracts" : "จัดการเอกสารและสัญญาที่เกี่ยวข้อง"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <TemplateDialog
            ownerId={ownerId}
            ownerType={ownerType as any}
            onGenerateComplete={() => setRefreshKey((k) => k + 1)}
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:w-auto h-9 sm:h-11 font-semibold text-blue-600! border-blue-200 hover:bg-blue-50 cursor-pointer"
              >
                <Wand2 className="mr-1.5 h-3.5 w-3.5 shrink-0" /> {isEn ? "Create" : "สร้าง"}
              </Button>
            }
          />
          <ResponsiveDialog
            open={open}
            onOpenChange={(val: boolean) => setOpen(val)}
            title={isEn ? "Upload Document" : "อัปโหลดเอกสาร"}
            description={isEn ? "Select files to upload (Supports PDF, Images, and general documents)" : "เลือกไฟล์เอกสารที่ต้องการแนบในระบบ (รองรับ PDF, รูปภาพ, และเอกสารทั่วไป)"}
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:w-auto h-9 sm:h-11 font-semibold transition-all active:scale-95 cursor-pointer"
              >
                <Upload className="mr-1.5 h-3.5 w-3.5 shrink-0" /> {isEn ? "Upload" : "อัปโหลด"}
              </Button>
            }
          >
            <div className="p-4 sm:p-6 text-left">
              <DocumentUpload
                ownerId={ownerId}
                ownerType={ownerType}
                tenantId={tenantId}
                onUploadComplete={() => {
                  setRefreshKey((k) => k + 1);
                  setOpen(false);
                }}
              />
            </div>
          </ResponsiveDialog>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="p-4 sm:p-5 h-full overflow-y-auto">
          <DocumentList
            ownerId={ownerId}
            ownerType={ownerType}
            refreshTrigger={refreshKey}
          />
        </div>
      </div>
    </div>
  );
}
