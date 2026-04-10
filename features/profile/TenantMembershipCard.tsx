import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck } from "lucide-react";

import { type TenantMembership } from "./types";

export function TenantMembershipCard({ memberships }: { memberships: TenantMembership[] }) {
  if (!memberships || memberships.length === 0) return null;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg font-semibold">สาขาที่สังกัด</CardTitle>
        </div>
        <CardDescription>รายชื่อสาขาที่คุณเป็นสมาชิกและบทบาทในแต่ละสาขา</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {memberships.map((m, i) => (
          <div key={m.tenant?.id || i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
            <div className="font-medium text-slate-900">{m.tenant?.name || "ไม่ทราบชื่อสาขา"}</div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {m.role}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
