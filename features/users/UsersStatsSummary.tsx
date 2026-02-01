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
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      description: "รวมทุกบทบาท",
    },
    {
      title: "ผู้ดูแลระบบ (Admin)",
      value: totalAdmins,
      icon: Shield,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-100",
      description: "สิทธิ์การเข้าถึงสูงสุด",
    },
    {
      title: "เอเจนท์ (Agent)",
      value: totalAgents,
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      description: "ทีมงานขายและดูแลลีด",
    },
    {
      title: "รอการตรวจสอบ",
      value: totalUsersWaiting,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      description: "ต้องกำหนดบทบาท",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className={cn(
            "border-none shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 active:scale-95",
            stat.bgColor,
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest opacity-70",
                    stat.color,
                  )}
                >
                  {stat.title}
                </p>
                <div className="text-4xl font-semibold text-slate-900 tracking-tight leading-none pt-2">
                  {stat.value}
                </div>
              </div>
              <div className="p-3 bg-white/40 backdrop-blur-md rounded-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm border border-white/20">
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full animate-pulse",
                  stat.color.replace("text-", "bg-"),
                )}
              />
              <p className="text-xs text-slate-700 font-medium uppercase tracking-tighter opacity-60">
                {stat.description}
              </p>
            </div>
          </CardContent>
          <div
            className={cn(
              "h-1 w-full opacity-30",
              stat.color.replace("text-", "bg-"),
            )}
          />
        </Card>
      ))}
    </div>
  );
}
