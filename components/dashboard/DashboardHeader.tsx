import { GlobalSearch } from "@/components/dashboard/GlobalSearch";

interface DashboardHeaderProps {
  email?: string;
}

export function DashboardHeader({ email }: DashboardHeaderProps) {
  // Get time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "สวัสดีตอนเช้า" : hour < 18 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          {greeting}, {email?.split("@")[0]} 👋
        </h2>
        <p className="text-slate-500 mt-1">
          ศูนย์บริหารงานขายอสังหาฯ ของคุณ - อัพเดทแบบเรียลไทม์
        </p>
      </div>
      <GlobalSearch />
    </div>
  );
}
