import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { MdWavingHand } from "react-icons/md";

interface DashboardHeaderProps {
  email?: string | null;
  name?: string | null;
}

export function DashboardHeader({ email, name }: DashboardHeaderProps) {
  // Get time-based greeting safely
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "สวัสดีตอนเช้า" : hour < 18 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น";

  const currentDate = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-linear-to-r from-blue-500 to-indigo-600 px-6 py-8 rounded-2xl shadow-lg">
      <div className="space-y-1">
        <p
          className="text-sm font-medium text-blue-100 capitalize flex items-center gap-2"
          suppressHydrationWarning
        >
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          {currentDate}
        </p>
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-md flex items-center gap-2">
          <span suppressHydrationWarning>{greeting}</span>,{" "}
          {name || email?.split("@")[0] || "คุณ"}{" "}
          <MdWavingHand className="text-yellow-300 animate-wave inline-block" />
        </h2>
        <p className="text-blue-100 max-w-lg text-base">
          จัดการทรัพย์ ลีด และงานขายของคุณได้ง่ายๆ ในที่เดียว
        </p>
      </div>

      <div className="w-full md:w-auto min-w-[300px]">
        <GlobalSearch />
      </div>
    </div>
  );
}
