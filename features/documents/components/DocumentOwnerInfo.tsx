"use client";

import { User, Home, FileText } from "lucide-react";
import { DocumentWithRelations } from "../types";
import { DOC_OWNER_TYPE_LABELS } from "../schema";
import { Badge } from "@/components/ui/badge";

interface DocumentOwnerInfoProps {
  document: DocumentWithRelations;
}

// Helper to remove any ID suffix inside parenthesis (e.g. " (53c9a79bf4...:...)")
// Also replaces purely hex/colon IDs with readable fallbacks
const cleanTitle = (title?: string | null) => {
  if (!title) return "ไม่ระบุชื่อทรัพย์";
  const trimmed = title.trim();
  if (/^[a-fA-F0-9:]+$/.test(trimmed)) {
    return "ทรัพย์ทั่วไป";
  }
  return trimmed.replace(/\s*\([a-fA-F0-9:]+\)$/, "").trim();
};

const cleanName = (name?: string | null) => {
  if (!name) return "ไม่ระบุชื่อลูกค้า";
  const trimmed = name.trim();
  if (/^[a-fA-F0-9:]+$/.test(trimmed)) {
    return "ลูกค้าทั่วไป";
  }
  return trimmed.replace(/\s*\([a-fA-F0-9:]+\)$/, "").trim();
};

export function DocumentOwnerInfo({ document: doc }: DocumentOwnerInfoProps) {
  const renderOwnerDetail = () => {
    switch (doc.owner_type) {
      case "PROPERTY":
        return (
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <Home className="h-3 w-3 text-slate-400" />
            {cleanTitle(doc.property?.title) || "ไม่ระบุชื่อทรัพย์"}
          </span>
        );
      case "LEAD":
        return (
          <span className="font-semibold text-slate-800">
            👤 {cleanName(doc.lead?.full_name || doc.lead?.email)}
          </span>
        );
      case "DEAL": {
        if (!doc.deal) return "ไม่พบข้อมูลดีล";
        const isRent = String(doc.deal.deal_type).toUpperCase() !== "SALE";
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Badge 
                variant="outline" 
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                  isRent 
                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}
              >
                {isRent ? "เช่า" : "ขาย"}
              </Badge>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={doc.deal.property?.title || ""}>
                {cleanTitle(doc.deal.property?.title) || "ไม่ระบุชื่อทรัพย์"}
              </span>
            </div>
            {doc.deal.lead && (
              <span className="text-slate-400 font-medium text-[10px] ml-1">
                ลูกค้า: {cleanName(doc.deal.lead.full_name || doc.deal.lead.email)}
              </span>
            )}
          </div>
        );
      }
      case "RENTAL_CONTRACT": {
        if (!doc.rental_contract?.deal) return "ไม่พบข้อมูลสัญญาเช่า";
        const deal = doc.rental_contract.deal;
        const isRent = String(deal.deal_type).toUpperCase() !== "SALE";
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Badge 
                variant="outline" 
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                  isRent 
                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                }`}
              >
                สัญญาเช่า
              </Badge>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={deal.property?.title || ""}>
                {cleanTitle(deal.property?.title) || "ไม่ระบุชื่อทรัพย์"}
              </span>
            </div>
            {deal.lead && (
              <span className="text-slate-400 font-medium text-[10px] ml-1">
                ลูกค้า: {cleanName(deal.lead.full_name || deal.lead.email)}
              </span>
            )}
          </div>
        );
      }
      default:
        return <span className="font-medium text-slate-600">{doc.owner_id}</span>;
    }
  };

  return (
    <div className="flex items-start gap-2 overflow-hidden py-0.5">
      <div className="text-[12px] leading-tight w-full">
        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider mb-1">
          {DOC_OWNER_TYPE_LABELS[doc.owner_type] || doc.owner_type}
        </span>
        <div className="mt-0.5">
          {renderOwnerDetail()}
        </div>
      </div>
    </div>
  );
}

