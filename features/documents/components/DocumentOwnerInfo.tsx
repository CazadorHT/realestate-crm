"use client";

import { User } from "lucide-react";
import { DocumentWithRelations } from "../types";
import { DOC_OWNER_TYPE_LABELS } from "../schema";

interface DocumentOwnerInfoProps {
  document: DocumentWithRelations;
}

export function DocumentOwnerInfo({ document: doc }: DocumentOwnerInfoProps) {
  const renderOwnerDetail = () => {
    switch (doc.owner_type) {
      case "PROPERTY":
        return doc.property?.title || "ไม่ระบุชื่อทรัพย์";
      case "LEAD":
        return doc.lead?.full_name || doc.lead?.email || "ไม่ระบุชื่อลูกค้า";
      case "DEAL":
        if (!doc.deal) return "ไม่พบข้อมูลดีล";
        return (
          <>
            {doc.deal.property?.title || "ไม่ระบุชื่อทรัพย์"}{" "}
            {doc.deal.lead ? (
              <span className="text-slate-400 font-normal ml-1 text-[11px]">
                ({doc.deal.lead.full_name || doc.deal.lead.email})
              </span>
            ) : (
              <span className="text-slate-400 font-normal ml-1 text-[11px]">
                (ไม่ระบุลูกค้า)
              </span>
            )}
          </>
        );
      case "RENTAL_CONTRACT":
        if (!doc.rental_contract?.deal) return "ไม่พบข้อมูลสัญญาเช่า";
        return (
          <>
            {doc.rental_contract.deal.property?.title || "ไม่ระบุชื่อทรัพย์"}{" "}
            {doc.rental_contract.deal.lead ? (
              <span className="text-slate-400 font-normal ml-1 text-[11px]">
                ({doc.rental_contract.deal.lead.full_name ||
                  doc.rental_contract.deal.lead.email})
              </span>
            ) : (
              <span className="text-slate-400 font-normal ml-1 text-[11px]">
                (ไม่ระบุลูกค้า)
              </span>
            )}
          </>
        );
      default:
        return doc.owner_id;
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      <div className="text-[12px] truncate leading-tight">
        <span className="text-slate-500 mr-1">
          {DOC_OWNER_TYPE_LABELS[doc.owner_type] || doc.owner_type}:
        </span>
        <span className="font-medium text-slate-700">
          {renderOwnerDetail()}
        </span>
      </div>
    </div>
  );
}
