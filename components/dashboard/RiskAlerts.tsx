import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RISK_DEALS } from "@/lib/dashboard-data";
import { AlertTriangle } from "lucide-react";

export function RiskAlerts() {
  return (
    <Card className="shadow-sm h-full border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertTriangle className="h-4 w-4" />
          ดีลเสี่ยง / ค้างนาน
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
           {RISK_DEALS.length === 0 && (
            <p className="text-xs text-muted-foreground">ไม่มีดีลที่มีความเสี่ยง</p>
          )}
          {RISK_DEALS.map((deal) => (
            <div key={deal.id} className="flex flex-col bg-white dark:bg-card p-2 rounded border shadow-sm">
              <span className="text-sm font-medium truncate">{deal.title}</span>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">Stage: {deal.stage}</span>
                <span className="text-xs font-bold text-red-600">
                  ค้าง {deal.daysInStage} วัน
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
