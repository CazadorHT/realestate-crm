import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle } from "lucide-react";
import type { FollowUpLead } from "@/features/dashboard/queries";

interface FollowUpInsightsProps {
  leads?: FollowUpLead[];
}

export function FollowUpInsights({ leads = [] }: FollowUpInsightsProps) {
  return (
    <Card className="shadow-sm h-full border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <Phone className="h-4 w-4" />
          ต้องติดตาม (Follow Up)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              ไม่มีรายการค้างติดตาม
            </p>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between bg-white dark:bg-card p-2 rounded border border-stone-200 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium">{lead.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] h-5 px-1">
                      {lead.stage}
                    </Badge>
                    <span className="text-xs text-red-500 font-medium">
                      หายไป {lead.daysQuiet} วัน
                    </span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
