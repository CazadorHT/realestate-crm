"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  MoreVertical,
  History,
  PenTool,
  Sparkles,
} from "lucide-react";
import { DocumentWithRelations } from "../types";
import { VersionHistoryDialog } from "./VersionHistoryDialog";
import { ESignDialog } from "./ESignDialog";
import { AIDocumentInsight } from "./AIDocumentInsight";
import { useLanguage } from "@/lib/i18n/language-context";

interface DocumentActionsProps {
  document: DocumentWithRelations;
  tenantId?: string | null;
}

export function DocumentActions({ document: doc, tenantId }: DocumentActionsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [menuOpen, setMenuOpen] = useState(false);

  const canShowAdvanced =
    doc.owner_type === "LEAD" ||
    doc.owner_type === "DEAL" ||
    doc.owner_type === "RENTAL_CONTRACT";

  if (!canShowAdvanced) return null;

  return (
    <ResponsiveDialog
      open={menuOpen}
      onOpenChange={setMenuOpen}
      className="sm:max-w-sm!"
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer">
          <MoreVertical className="h-4 w-4" />
        </Button>
      }
      title={isEn ? "Manage Document" : "จัดการเอกสาร"}
      description={isEn ? "Select analytics tools or additional management options" : "เลือกเครื่องมือวิเคราะห์หรือจัดการข้อมูลเพิ่มเติม"}
    >
      <div className="p-4 space-y-3">
        <VersionHistoryDialog
          documentId={doc.id}
          documentName={doc.file_name}
          ownerId={doc.owner_id}
          ownerType={doc.owner_type}
          tenantId={tenantId}
          trigger={
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4 px-4 rounded-2xl border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 text-slate-700! transition-all hover:scale-[1.01] cursor-pointer"
              onClick={() => setMenuOpen(false)}
            >
              <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <History className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{isEn ? "Version History" : "ประวัติเวอร์ชัน"}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isEn ? "View and upload new revisions" : "ดูและอัปโหลดไฟล์ชุดใหม่เข้าประวัติ"}
                </p>
              </div>
            </Button>
          }
        />

        <ESignDialog
          documentId={doc.id}
          documentName={doc.file_name}
          currentStatus={doc.esign_status}
          trigger={
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4 px-4 rounded-2xl border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 text-slate-700! transition-all hover:scale-[1.01] cursor-pointer"
              onClick={() => setMenuOpen(false)}
            >
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <PenTool className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{isEn ? "E-Signature Management" : "จัดการ E-Signature"}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isEn ? "Verify signature and update contract status" : "ยืนยันการเซ็นชื่อและอัปเดตสถานะสัญญา"}
                </p>
              </div>
            </Button>
          }
        />

        <AIDocumentInsight
          documentId={doc.id}
          documentName={doc.file_name}
          initialSummary={doc.ai_summary}
          initialAnalysis={doc.ai_analysis}
          trigger={
            <Button
              variant="outline"
              className="w-full h-14 justify-start gap-4 px-4 rounded-2xl border-slate-100 hover:border-amber-100 hover:bg-amber-50/30 text-slate-700! transition-all hover:scale-[1.01] cursor-pointer"
              onClick={() => setMenuOpen(false)}
            >
              <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{isEn ? "Analyze with AI" : "วิเคราะห์ด้วย AI"}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isEn ? "Auto summarize content and detect risks" : "สรุปเนื้อหาและตรวจสอบจุดเสี่ยงอัตโนมัติ"}
                </p>
              </div>
            </Button>
          }
        />
      </div>
    </ResponsiveDialog>
  );
}

