"use client";

import { DealWithProperty, DealPropertyOption } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import { Home, Eye, Edit2, Trash2 } from "lucide-react";
import { DealFormDialog } from "./DealFormDialog";
import { DeleteDealButton } from "./DeleteDealButton";
import { useRouter } from "next/navigation";

interface DealListProps {
  deals: DealWithProperty[];
  properties?: DealPropertyOption[];
}

export function DealList({ deals, properties = [] }: DealListProps) {
  const router = useRouter();

  if (deals.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground border rounded-md border-dashed">
        ยังไม่มีดีลสำหรับลีดนี้
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deals.map((deal) => (
        <Card key={deal.id} className="overflow-hidden border border-slate-200">
          <CardContent className="p-3 flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Property Cover Image */}
            <div className="shrink-0">
              {deal.property?.property_images?.[0]?.image_url ? (
                <img
                  src={
                    deal.property.property_images.find((img) => img.is_cover)
                      ?.image_url || deal.property.property_images[0].image_url
                  }
                  alt={deal.property.title || "Property"}
                  className="h-16 w-16 rounded-lg object-cover border transition-all duration-300 border-slate-100 dark:border-slate-800"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                  <Home className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <Link
                href={`/protected/properties/${deal.property_id}`}
                className="font-semibold text-sm hover:underline text-primary break-all line-clamp-2"
                title={deal.property?.title || "ทรัพย์ไม่ระบุชื่อ"}
              >
                {deal.property?.title || "ทรัพย์ไม่ระบุชื่อ"}
              </Link>
              <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 items-center">
                <Badge
                  variant="secondary"
                  className="font-medium text-xs px-1.5 py-0 h-5"
                >
                  {deal.deal_type === "RENT" ? "เช่า" : "ซื้อ-ขาย"}
                </Badge>
                {deal.transaction_date && (
                  <span className="flex items-center gap-1 text-xs">
                    {deal.deal_type === "RENT" ? "เริ่ม: " : "โอน: "}
                    {format(new Date(deal.transaction_date), "d MMM yy", {
                      locale: th,
                    })}
                  </span>
                )}
                {deal.deal_type === "RENT" && deal.transaction_end_date && (
                  <span className="flex items-center gap-1 text-xs">
                    ถึง:{" "}
                    {format(new Date(deal.transaction_end_date), "d MMM yy", {
                      locale: th,
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Status & Actions */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto gap-3 md:pl-4 md:border-l border-slate-100 dark:border-slate-800 ml-0 md:ml-auto shrink-0">
              <div className="flex items-center gap-2 order-2 md:order-1">
                <StatusBadge status={deal.status} />
              </div>

              <div className="flex items-center gap-1 order-3 md:order-2">
                {/* View Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-muted-foreground hover:text-primary p-0"
                  asChild
                >
                  <Link href={`/protected/deals/${deal.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>

                <DealFormDialog
                  leadId={deal.lead_id}
                  deal={deal}
                  properties={properties}
                  refreshOnSuccess
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 text-muted-foreground hover:text-blue-600 p-0"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  }
                />

                <DeleteDealButton
                  dealId={deal.id}
                  leadId={deal.lead_id}
                  iconOnly
                  onSuccess={() => router.refresh()}
                />
              </div>

              {deal.commission_amount && deal.commission_amount > 0 && (
                <div className="order-1 md:order-3 md:mt-1">
                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                    ค่าคอม + {deal.commission_amount.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styleMap: Record<string, string> = {
    NEGOTIATING: "bg-blue-100 text-blue-800",
    SIGNED: "bg-purple-100 text-purple-800",
    CLOSED_WIN: "bg-green-100 text-green-800",
    CLOSED_LOSS: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  const labelMap: Record<string, string> = {
    NEGOTIATING: "กำลังต่อรอง",
    SIGNED: "เซ็นสัญญา",
    CLOSED_WIN: "สำเร็จ",
    CLOSED_LOSS: "ไม่สำเร็จ",
    CANCELLED: "ยกเลิก",
  };

  const badgeClass = styleMap[status] || "bg-gray-100";
  const label = labelMap[status] || status;

  return (
    <Badge
      variant="outline"
      className={`border-0 ${badgeClass}`}
      title={status}
    >
      {label}
    </Badge>
  );
}
