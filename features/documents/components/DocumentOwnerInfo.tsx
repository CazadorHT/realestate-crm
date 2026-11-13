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

  const getBilingualProject = (prop: any) => {
    if (!prop) return "";
    const en = prop.project_name_en || (prop.title_en && prop.title_en !== prop.title ? prop.title_en : null);
    const th = prop.project_name || prop.title;
    if (en && th && en.toLowerCase() !== th.toLowerCase()) {
      return `${en} (${th})`;
    }
    return en || th || "";
  };

  const renderOwnerDetail = () => {
    switch (doc.owner_type) {
      case "PROPERTY": {
        const prop = doc.property;
        const projectDisplay = getBilingualProject(prop);

        return (
          <div className="flex flex-col gap-1 min-w-0">
            {projectDisplay && (
              <span className="text-sm sm:text-base font-bold text-indigo-700 tracking-tight truncate max-w-lg">
                {projectDisplay}
              </span>
            )}
            <span className="font-semibold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-lg" title={prop?.title || ""}>
                {cleanTitle(prop?.title, prop?.title_en)}
              </span>
            </span>
          </div>
        );
      }
      case "LEAD":
        return (
          <span className="font-bold text-slate-900 text-sm sm:text-base">
            👤 {cleanName(doc.lead?.full_name || doc.lead?.email)}
          </span>
        );
      case "DEAL": {
        if (!doc.deal) return isEn ? "Deal not found" : "ไม่พบข้อมูลดีล";
        const isRent = String(doc.deal.deal_type).toUpperCase() !== "SALE";
        const prop = doc.deal.property;
        const projectDisplay = getBilingualProject(prop);

        return (
          <div className="flex flex-col gap-1 min-w-0">
            {projectDisplay && (
              <span className="text-sm sm:text-base font-bold text-indigo-700 tracking-tight truncate max-w-lg">
                {projectDisplay}
              </span>
            )}
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <Badge 
                variant="outline" 
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  isRent 
                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {isRent ? (isEn ? "Rent" : "เช่า") : (isEn ? "Sale" : "ขาย")}
              </Badge>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate max-w-lg" title={prop?.title || ""}>
                {cleanTitle(prop?.title, prop?.title_en)}
              </span>
            </div>
            {doc.deal.lead && (
              <span className="text-slate-500 font-medium text-xs sm:text-sm truncate max-w-lg">
                {isEn ? "Client: " : "ลูกค้า: "}
                <span className="text-slate-800 font-semibold">
                  {cleanName(doc.deal.lead.full_name || doc.deal.lead.email)}
                </span>
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
        const projectDisplay = getBilingualProject(prop);

        return (
          <div className="flex flex-col gap-1 min-w-0">
            {projectDisplay && (
              <span className="text-sm sm:text-base font-bold text-indigo-700 tracking-tight truncate max-w-lg">
                {projectDisplay}
              </span>
            )}
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <Badge 
                variant="outline" 
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                  isRent 
                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {isEn ? "Rental Contract" : "สัญญาเช่า"}
              </Badge>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate max-w-lg" title={prop?.title || ""}>
                {cleanTitle(prop?.title, prop?.title_en)}
              </span>
            </div>
            {deal.lead && (
              <span className="text-slate-500 font-medium text-xs sm:text-sm truncate max-w-lg">
                {isEn ? "Client: " : "ลูกค้า: "}
                <span className="text-slate-800 font-semibold">
                  {cleanName(deal.lead.full_name || deal.lead.email)}
                </span>
              </span>
            )}
          </div>
        );
      }
      default:
        return <span className="font-medium text-slate-700 text-sm">{doc.owner_id}</span>;
    }
  };

  const ownerLabels = isEn ? DOC_OWNER_TYPE_LABELS_EN : DOC_OWNER_TYPE_LABELS;

  return (
    <div className="flex items-start gap-2 overflow-hidden py-1 min-w-0">
      <div className="text-sm leading-snug w-full min-w-0">
        <span className="text-slate-400 font-bold block text-[11px] uppercase tracking-wider mb-1">
          {ownerLabels[doc.owner_type] || doc.owner_type}
        </span>
        <div className="mt-0.5 min-w-0">
          {renderOwnerDetail()}
        </div>
      </div>
    </div>
  );
}



