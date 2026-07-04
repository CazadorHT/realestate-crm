"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInHours } from "date-fns";
import { Eye, Edit, Loader2 } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { DealWithProperty, DealPropertyOption } from "../types";
import { DealStatusBadge } from "./DealStatusBadge";
import { DealFormDialog } from "./DealFormDialog";
import { DeleteDealButton } from "./DeleteDealButton";

interface DealsTableRowProps {
  deal: DealWithProperty;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  properties: DealPropertyOption[];
  onRefresh: () => void;
}

export function DealsTableRow({
  deal,
  isSelected,
  onToggleSelect,
  properties,
  onRefresh,
}: DealsTableRowProps) {
  const router = useRouter();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const isNew =
    deal.created_at &&
    differenceInHours(new Date(), new Date(deal.created_at)) < 24;

  const netComm = (deal as any).commission_net !== undefined 
    ? (deal as any).commission_net 
    : (Number(deal.commission_total) || 0);

  return (
    <TableRow
      className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-blue-50/50" : ""}`}
    >
      <TableCell className="w-[50px]">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(deal.id)}
        />
      </TableCell>
      <TableCell>
        <Badge
          variant={deal.deal_type === "RENT" ? "secondary" : "default"}
          className="font-normal w-[60px] justify-center"
        >
          {deal.deal_type === "RENT" ? "เช่า" : "ขาย"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1 max-w-[300px]">
          <div
            onClick={() => {
              setNavigatingId(`prop-${deal.property_id}`);
              router.push(`/protected/properties/${deal.property_id}`);
            }}
            className="font-medium text-[13px] text-blue-600 hover:text-blue-500 hover:underline transition-colors line-clamp-1 uppercase tracking-tight cursor-pointer relative"
          >
            {navigatingId === `prop-${deal.property_id}` && (
              <Loader2 className="h-3 w-3 animate-spin text-blue-600 absolute -left-4 top-1" />
            )}
            {deal.property?.title || "-"}
          </div>
          <div className="flex items-center gap-1.5">
            {isNew && (
              <Badge className="h-4 px-1 text-[9px] bg-amber-500 hover:bg-amber-600 font-bold border-0 rounded-sm">
                NEW
              </Badge>
            )}
            {deal.tenants?.name && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100 px-1 rounded-sm border border-slate-200/50">
                {deal.tenants.name}
              </span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div
          onClick={() => {
            setNavigatingId(`lead-${deal.lead_id}`);
            router.push(`/protected/leads/${deal.lead_id}`);
          }}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 hover:underline transition-colors line-clamp-1  tracking-tight cursor-pointer relative"
        >
          {navigatingId === `lead-${deal.lead_id}` && (
            <Loader2 className="h-3 w-3 animate-spin text-blue-600 absolute -left-4 top-0.5" />
          )}
          คุณ {deal.lead?.full_name || "ไม่ได้ระบุ"}
        </div>
      </TableCell>
      <TableCell className="font-bold text-slate-700 text-[11px]">
        <div className="flex flex-col items-start gap-0.5">
          {(() => {
            const isRent = deal.deal_type === "RENT";
            const current =
              (isRent ? deal.property?.rental_price : deal.property?.price) ||
              0;
            const original =
              (isRent
                ? deal.property?.original_rental_price
                : deal.property?.original_price) || 0;
            const displayPrice =
              current === 0 && original > 0 ? original : current;
            const showOriginal = current > 0 && original > current;

            if (displayPrice === 0) return "-";
            return (
              <>
                <span className="whitespace-nowrap font-bold">
                  {displayPrice.toLocaleString()} ฿
                </span>
                {showOriginal && (
                  <span className="text-[10px] text-slate-400 line-through font-medium">
                    {original.toLocaleString()}
                  </span>
                )}
              </>
            );
          })()}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-green-600 font-bold text-[11.5px] whitespace-nowrap" title="ค่าคอมมิชชันหลังหัก Co-Broker">
            {netComm.toLocaleString()} ฿
          </span>
          {deal.commission_total && Number(deal.commission_total) > Number(netComm) && (
            <span className="text-[9px] text-slate-400 line-through whitespace-nowrap" title="ค่าคอมมิชชันก่อนหัก Co-Broker (Gross)">
              {Number(deal.commission_total).toLocaleString()} ฿
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-slate-500 text-[11px] font-bold">
        {deal.deal_type === "RENT" && deal.duration_months ? (
          <span className="whitespace-nowrap uppercase">
            {deal.duration_months} เดือน
          </span>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </TableCell>
      <TableCell className="text-slate-500 text-[11px] font-bold">
        <span className="whitespace-nowrap">
          {deal.transaction_date ? formatDate(deal.transaction_date) : "-"}
        </span>
      </TableCell>
      <TableCell>
        <DealStatusBadge status={deal.status} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
            onClick={() => {
              setNavigatingId(`view-${deal.id}`);
              router.push(`/protected/deals/${deal.id}`);
            }}
            disabled={navigatingId === `view-${deal.id}`}
          >
            {navigatingId === `view-${deal.id}` ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>

          <DealFormDialog
            leadId={deal.lead_id || ""}
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

          <DeleteDealButton
            dealId={deal.id}
            leadId={deal.lead_id || ""}
            propertyName={deal.property?.title}
            customerName={deal.lead?.full_name}
            onSuccess={onRefresh}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
