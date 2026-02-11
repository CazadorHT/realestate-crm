import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TopAgent } from "@/features/dashboard/queries";

interface TopAgentsProps {
  data: TopAgent[];
}

export function TopAgents({ data }: TopAgentsProps) {
  return (
    <Card className="h-full shadow-lg border-none bg-white dark:bg-slate-900 overflow-hidden relative group">
      {/* Subtle decorative background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-400/10 transition-colors duration-500" />

      <CardHeader className="pb-3 px-4 sm:px-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="text-xl">🏆</span> ตัวแทนยอดเยี่ยม
            </CardTitle>
            <p className="text-xs text-slate-500 font-medium">
              จัดอันดับตามค่าคอมมิชชั่น
            </p>
          </div>
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Top 5
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-6 relative z-10">
        <div className="space-y-4">
          {data.map((agent, index) => (
            <div
              key={agent.id}
              className="flex items-center justify-between group/item p-2 -mx-1 sm:-mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors gap-2"
            >
              <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black text-xs shadow-sm
                  ${
                    index === 0
                      ? "bg-linear-to-br from-yellow-300 to-yellow-500 text-white ring-4 ring-yellow-50 dark:ring-yellow-900/20"
                      : index === 1
                        ? "bg-linear-to-br from-slate-300 to-slate-400 text-white ring-4 ring-slate-50 dark:ring-slate-800/30"
                        : index === 2
                          ? "bg-linear-to-br from-orange-300 to-orange-400 text-white ring-4 ring-orange-50 dark:ring-orange-900/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {index + 1}
                </div>

                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                    <AvatarImage src={agent.avatar_url || ""} />
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-700 font-bold text-slate-600">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 text-xs">👑</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {agent.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    {agent.deals_count} ปิดดีลสำเร็จ
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-400 font-bold mb-0.5">
                  COMMISSION
                </div>
                <div className="font-black text-sm text-blue-600 dark:text-blue-400">
                  ฿{agent.total_commission.toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 opacity-60">
              <span className="text-4xl mb-3">😶</span>
              <p className="text-sm font-medium text-slate-400">
                ยังไม่มีข้อมูลยอดขาย
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
