"use client";

import Link from "next/link";
import { differenceInHours } from "date-fns";
import { Handshake, Eye, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { DealWithProperty, DealPropertyOption } from "../types";
import { DealStatusBadge } from "./DealStatusBadge";
import { DealFormDialog } from "./DealFormDialog";

interface DealsMobileCardProps {
  deal: DealWithProperty;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  properties: DealPropertyOption[];
  onRefresh: () => void;
}

export function DealsMobileCard({
  deal,
  isSelected,
  onToggleSelect,
  properties,
  onRefresh,
}: DealsMobileCardProps) {
  const isNew =
    deal.created_at &&
    differenceInHours(new Date(), new Date(deal.created_at)) < 24;

  return (
    <div
      className={`p-4 transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
    >
      <div className="flex gap-4">
        <div className="flex flex-col gap-3 shrink-0 py-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(deal.id)}
          />
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Handshake className="h-5 w-5" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/protected/deals/${deal.id}`}
                  className="font-bold text-slate-900 text-sm hover:underline line-clamp-2"
                >
                  {deal.property?.title || "ไม่ระบุทรัพย์"}
                </Link>
                {isNew && (
                  <Badge className="h-4 px-1.5 text-[9px] bg-amber-500 hover:bg-amber-600 border-0">
                    NEW
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={deal.deal_type === "RENT" ? "secondary" : "default"}
                  className="h-4 text-[9px] px-1.5 font-bold"
                >
                  {deal.deal_type === "RENT" ? "เช่า" : "ขาย"}
                </Badge>
                <DealStatusBadge status={deal.status} />
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
              >
                <Link href={`/protected/deals/${deal.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <DealFormDialog
                leadId={deal.lead_id}
                properties={properties}
                deal={deal}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                }
                onSuccess={onRefresh}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-slate-400">ลูกค้า (Lead):</span>
              <Link
                href={`/protected/leads/${deal.lead_id}`}
                className="font-medium text-blue-600 hover:underline line-clamp-1"
              >
                {deal.lead?.full_name || "-"}
              </Link>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400">ราคา:</span>
              <span className="font-semibold text-slate-900">
                {(() => {
                  const isRent = deal.deal_type === "RENT";
                  const current =
                    (isRent
                      ? deal.property?.rental_price
                      : deal.property?.price) || 0;
                  return current > 0 ? `${current.toLocaleString()} ฿` : "-";
                })()}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400">ค่าคอมมิชชั่น:</span>
              <span className="font-semibold text-green-600">
                {deal.commission_amount
                  ? `${deal.commission_amount.toLocaleString()} ฿`
                  : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-400">วันที่:</span>
              <span className="text-slate-600">
                {deal.transaction_date
                  ? formatDate(deal.transaction_date)
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
