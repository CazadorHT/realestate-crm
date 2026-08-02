"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FollowUpLead } from "@/features/dashboard/queries";

interface FollowUpInsightsProps {
  leads?: FollowUpLead[];
  role?: string;
  view?: string;
}

export function FollowUpInsights({ leads = [], role, view = "personal" }: FollowUpInsightsProps) {
  const router = useRouter();
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const isAdminView = (role === "ADMIN" || role === "MANAGER" || role === "OWNER") && view !== "personal";
  return (
    <Card className="shadow-sm h-full border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-orange-800">
          <Phone className="h-4 w-4" />
          ต้องติดตาม (Follow Up)
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="space-y-3 max-h-[200px] custom-scrollbar overflow-y-auto px-4 sm:px-6 py-4">
          {leads.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              ไม่มีรายการค้างติดตาม
            </p>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-stone-200 shadow-sm"
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
                    {isAdminView && (
                      <span className="text-[10px] text-slate-400 font-bold ml-1">
                        • โดย: {lead.agentName || "ไม่ระบุ"}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={() => {
                    setNavigatingId(lead.id);
                    router.push(`/protected/leads/${lead.id}`);
                  }}
                  disabled={navigatingId === lead.id}
                >
                  {navigatingId === lead.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
