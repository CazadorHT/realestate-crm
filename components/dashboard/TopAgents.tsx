import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TopAgent } from "@/features/dashboard/queries";

interface TopAgentsProps {
  data: TopAgent[];
}

export function TopAgents({ data }: TopAgentsProps) {
  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🏆 Top Agents
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            (By Commission)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((agent, index) => (
            <div key={agent.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs
                  ${
                    index === 0
                      ? "bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50"
                      : index === 1
                      ? "bg-slate-100 text-slate-700"
                      : index === 2
                      ? "bg-orange-100 text-orange-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={agent.avatar_url || ""} />
                  <AvatarFallback>
                    {agent.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {agent.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {agent.deals_count} Deals closed
                  </p>
                </div>
              </div>
              <div className="font-semibold text-sm">
                ฿{agent.total_commission.toLocaleString()}
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              ยังไม่มีข้อมูลยอดขาย
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
