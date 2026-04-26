"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RiskDeal } from "@/features/dashboard/queries";

interface RiskAlertsProps {
  deals?: RiskDeal[];
}

export function RiskAlerts({ deals = [] }: RiskAlertsProps) {
  const router = useRouter();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  return (
    <Card className="shadow-sm h-full border-red-200 bg-red-50/50">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-4 w-4" />
          ดีลเสี่ยง / ค้างนาน
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="space-y-3 max-h-[200px] custom-scrollbar overflow-y-auto px-4 sm:px-6 py-4">
          {deals.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              ไม่มีดีลที่มีความเสี่ยง
            </p>
          ) : (
            deals.map((deal) => (
            <div
                key={deal.id}
                onClick={() => {
                  setNavigatingId(deal.id);
                  router.push(`/protected/deals/${deal.id}`);
                }}
                className="flex flex-col bg-white p-2 rounded border border-red-200 shadow-sm cursor-pointer relative group/item"
              >
                {navigatingId === deal.id && (
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                  </div>
                )}
                <span className="text-sm font-medium truncate">
                  {deal.title}
                </span>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    Stage: {deal.stage}
                  </span>
                  <span className="text-xs font-bold text-red-600">
                    ค้าง {deal.daysInStage} วัน
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
