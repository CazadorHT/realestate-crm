"use client";

import Link from "next/link";
import { differenceInHours } from "date-fns";
import { Eye, Edit } from "lucide-react";
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
  const isNew =
    deal.created_at &&
    differenceInHours(new Date(), new Date(deal.created_at)) < 24;

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
        <div className="flex gap-2 max-w-[300px]">
          <Link
            href={`/protected/properties/${deal.property_id}`}
            className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors line-clamp-2"
          >
            {deal.property?.title || "-"}
          </Link>
          {isNew && (
            <Badge className="h-4 px-1 text-[9px] bg-amber-500 hover:bg-amber-600 font-bold border-0">
              NEW
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Link
          href={`/protected/leads/${deal.lead_id}`}
          className="text-sm text-slate-600 hover:text-blue-600 hover:underline transition-colors line-clamp-1"
        >
          {deal.lead?.full_name || "-"}
        </Link>
      </TableCell>
      <TableCell className="font-medium text-slate-700">
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
                <span className="whitespace-nowrap">
                  {displayPrice.toLocaleString()} ฿
                </span>
                {showOriginal && (
                  <span className="text-[10px] text-slate-400 line-through">
                    {original.toLocaleString()}
                  </span>
                )}
              </>
            );
          })()}
        </div>
      </TableCell>
      <TableCell>
        {deal.commission_amount ? (
          <span className="text-green-600 font-semibold whitespace-nowrap">
            {deal.commission_amount.toLocaleString()} ฿
          </span>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell className="text-slate-600">
        {deal.deal_type === "RENT" && deal.duration_months ? (
          <span className="text-sm whitespace-nowrap">
            {deal.duration_months} เดือน
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </TableCell>
      <TableCell className="text-slate-600">
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

          <DeleteDealButton
            dealId={deal.id}
            leadId={deal.lead_id}
            onSuccess={onRefresh}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
