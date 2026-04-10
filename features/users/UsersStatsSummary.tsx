import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsersStatsSummaryProps {
  totalUsers: number;
  totalAdmins: number;
  totalAgents: number;
  totalUsersWaiting: number;
}

export function UsersStatsSummary({
  totalUsers,
  totalAdmins,
  totalAgents,
  totalUsersWaiting,
}: UsersStatsSummaryProps) {
  const stats = [
    {
      title: "ผู้ใช้ทั้งหมด",
      value: totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-400/5",
      borderColor: "border-blue-200/50",
      description: "รวมทุกบทบาท",
    },
    {
      title: "ผู้ดูแลระบบ (Admin)",
      value: totalAdmins,
      icon: Shield,
      color: "text-indigo-600",
      bgColor: "bg-indigo-400/5",
      borderColor: "border-indigo-200/50",
      description: "สิทธิ์การเข้าถึงสูงสุด",
    },
    {
      title: "เอเจนท์ (Agent)",
      value: totalAgents,
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-400/5",
      borderColor: "border-emerald-200/50",
      description: "ทีมงานขายและดูแลลีด",
    },
    {
      title: "รอการตรวจสอบ",
      value: totalUsersWaiting,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-400/5",
      borderColor: "border-amber-200/50",
      description: "ต้องกำหนดบทบาท",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className={cn(
            "relative border border-white/40 shadow-xl shadow-slate-200/40 overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 active:scale-[0.98] bg-white/40 backdrop-blur-xl rounded-3xl",
          )}
        >
          {/* Decorative background circle */}
          <div className={cn(
            "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:scale-150 group-hover:opacity-30",
            stat.color.replace("text-", "bg-")
          )} />
          
          <CardContent className="p-7 relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.2em] opacity-80",
                    stat.color,
                  )}
                >
                  {stat.title}
                </p>
                <div className="text-4xl font-semibold text-slate-900 tracking-tighter pt-2">
                  {stat.value}
                </div>
              </div>
              <div className="p-3.5 bg-white/60 backdrop-blur-md rounded-2xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-sm border border-white/60">
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full animate-pulse",
                  stat.color.replace("text-", "bg-"),
                )}
              />
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">
                {stat.description}
              </p>
            </div>
          </CardContent>
          
          {/* Progress hint bottom bar */}
          <div
            className={cn(
              "h-1 w-full opacity-20",
              stat.color.replace("text-", "bg-"),
            )}
          />
        </Card>
      ))}
    </div>
  );
}
