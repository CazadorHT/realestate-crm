"use client";

import { DealWithProperty } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import { Home, Eye } from "lucide-react";

interface DealListProps {
  deals: DealWithProperty[];
}

export function DealList({ deals }: DealListProps) {
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
        <Card key={deal.id} className="overflow-hidden">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Left: Property Info */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0">
                <Home className="h-6 w-6 text-muted-foreground" />
              </div>{" "}
              {/* Placeholder for image if needed */}
              <div>
                <Link
                  href={`/protected/properties/${deal.property_id}`}
                  className="font-semibold hover:underline text-primary"
                >
                  {deal.property?.title || "ทรัพย์ไม่ระบุชื่อ"}
                </Link>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                  <span className="font-medium text-foreground">
                    {deal.deal_type === "RENT" ? "เช่า" : "ซื้อ"}
                  </span>
                  {deal.transaction_date && (
                    <span className="flex items-center gap-1">
                      {deal.deal_type === "RENT"
                        ? "วันเริ่มสัญญา: "
                        : "วันที่โอน: "}
                      {format(new Date(deal.transaction_date), "d MMM yy", {
                        locale: th,
                      })}
                    </span>
                  )}
                  {deal.deal_type === "RENT" && deal.transaction_end_date && (
                    <span className="flex items-center gap-1">
                      ถึง:{" "}
                      {format(new Date(deal.transaction_end_date), "d MMM yy", {
                        locale: th,
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Status & Commission */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={deal.status} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  asChild
                >
                  <Link href={`/protected/deals/${deal.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {deal.commission_amount && deal.commission_amount > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  คอมฯ: {deal.commission_amount.toLocaleString()} ฿
                </span>
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
