"use client";

import { User, Home, FileText } from "lucide-react";
import { DocumentWithRelations } from "../types";
import { DOC_OWNER_TYPE_LABELS, DOC_OWNER_TYPE_LABELS_EN } from "../schema";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n/language-context";

interface DocumentOwnerInfoProps {
  document: DocumentWithRelations;
}

export function DocumentOwnerInfo({ document: doc }: DocumentOwnerInfoProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  // Helper to remove any ID suffix inside parenthesis (e.g. " (53c9a79bf4...:...)")
  // Also replaces purely hex/colon IDs with readable fallbacks
  const cleanTitle = (title?: string | null, titleEn?: string | null) => {
    const raw = (isEn && (titleEn || title)) ? (titleEn || title) : (title || titleEn);
    if (!raw) return isEn ? "Unnamed Property" : "ไม่ระบุชื่อทรัพย์";
    const trimmed = raw.trim();
    if (/^[a-fA-F0-9:]+$/.test(trimmed)) {
      return isEn ? "General Property" : "ทรัพย์ทั่วไป";
    }
    return trimmed.replace(/\s*\([a-fA-F0-9:]+\)$/, "").trim();
  };

  const cleanName = (name?: string | null) => {
    if (!name) return isEn ? "Unnamed Client" : "ไม่ระบุชื่อลูกค้า";
    const trimmed = name.trim();
    if (/^[a-fA-F0-9:]+$/.test(trimmed)) {
      return isEn ? "General Client" : "ลูกค้าทั่วไป";
    }
    return trimmed.replace(/\s*\([a-fA-F0-9:]+\)$/, "").trim();
  };

  const renderOwnerDetail = () => {
    switch (doc.owner_type) {
      case "PROPERTY": {
        const prop = doc.property;
        const projectName = isEn
          ? (prop?.project_name_en || prop?.project_name)
          : (prop?.project_name || prop?.project_name_en);

        return (
          <div className="flex flex-col gap-0.5">
            {projectName && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 truncate max-w-sm">
                {projectName}
              </span>
            )}
            <span className="font-semibold text-slate-800 flex items-center gap-1">
              <Home className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-sm" title={prop?.title || ""}>
                {cleanTitle(prop?.title, prop?.title_en)}
              </span>
            </span>
          </div>
        );
      }
      case "LEAD":
        return (
          <span className="font-semibold text-slate-800">
            👤 {cleanName(doc.lead?.full_name || doc.lead?.email)}
          </span>
        );
      case "DEAL": {
        if (!doc.deal) return isEn ? "Deal not found" : "ไม่พบข้อมูลดีล";
        const isRent = String(doc.deal.deal_type).toUpperCase() !== "SALE";
        const prop = doc.deal.property;
        const projectName = isEn
          ? (prop?.project_name_en || prop?.project_name)
          : (prop?.project_name || prop?.project_name_en);

        return (
          <div className="flex flex-col gap-1">
            {projectName && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 truncate max-w-md">
                {projectName}
              </span>
            )}
            <div className="flex items-center gap-1.5 min-w-0">
              <Badge 
                variant="outline" 
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                  isRent 
                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}
              >
                {isRent ? (isEn ? "Rent" : "เช่า") : (isEn ? "Sale" : "ขาย")}
              </Badge>
              <span className="font-semibold text-slate-800 truncate max-w-md" title={prop?.title || ""}>
                {cleanTitle(prop?.title, prop?.title_en)}
              </span>
            </div>
            {doc.deal.lead && (
              <span className="text-slate-400 font-medium text-[10px] ml-1 truncate max-w-md">
                {isEn ? "Client: " : "ลูกค้า: "}{cleanName(doc.deal.lead.full_name || doc.deal.lead.email)}
              </span>
            )}
          </div>
        );
      }
      case "RENTAL_CONTRACT": {
        if (!doc.rental_contract?.deal) return isEn ? "Rental contract not found" : "ไม่พบข้อมูลสัญญาเช่า";
        const deal = doc.rental_contract.deal;
        const isRent = String(deal.deal_type).toUpperCase() !== "SALE";
        const prop = deal.property;
        const projectName = isEn
          ? (prop?.project_name_en || prop?.project_name)
          : (prop?.project_name || prop?.project_name_en);

        return (
          <div className="flex flex-col gap-1">
            {projectName && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 truncate max-w-md">
                {projectName}
              </span>
            )}
            <div className="flex items-center gap-1.5 min-w-0">
              <Badge 
                variant="outline" 
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                  isRent 
                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}
              >
                {isEn ? "Rental Contract" : "สัญญาเช่า"}
              </Badge>
              <span className="font-semibold text-slate-800 truncate max-w-md" title={prop?.title || ""}>
                {cleanTitle(prop?.title, prop?.title_en)}
              </span>
            </div>
            {deal.lead && (
              <span className="text-slate-400 font-medium text-[10px] ml-1 truncate max-w-md">
                {isEn ? "Client: " : "ลูกค้า: "}{cleanName(deal.lead.full_name || deal.lead.email)}
              </span>
            )}
          </div>
        );
      }
      default:
        return <span className="font-medium text-slate-600">{doc.owner_id}</span>;
    }
  };

  const ownerLabels = isEn ? DOC_OWNER_TYPE_LABELS_EN : DOC_OWNER_TYPE_LABELS;

  return (
    <div className="flex items-start gap-2 overflow-hidden py-0.5 min-w-0">
      <div className="text-[12px] leading-tight w-full min-w-0">
        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider mb-1">
          {ownerLabels[doc.owner_type] || doc.owner_type}
        </span>
        <div className="mt-0.5 min-w-0">
          {renderOwnerDetail()}
        </div>
      </div>
    </div>
  );
}



