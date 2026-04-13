"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  Settings, 
  Palette, 
  Share2, 
  Cpu, 
  ShieldCheck, 
  CircleDollarSign,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTabsProps {
  activeTab: string;
}

export function SettingsTabs({ activeTab }: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    { value: "general", label: "ทั่วไป (General)", description: "จัดการชื่อองค์กร สถาปัตยกรรม และข้อมูลพื้นฐาน", icon: Settings },
    { value: "branding", label: "แบรนด์ (Branding)", description: "ปรับแต่งโลโก้ สีสัน และอัตลักษณ์ของแบรนด์", icon: Palette },
    { value: "social", label: "Social", description: "เชื่อมต่อ FB, Line, TikTok และระบบแชท", icon: Share2 },
    { value: "ai", label: "AI Tools", description: "ตั้งค่าระบบปัญญาประดิษฐ์และ SmartMatch", icon: Cpu },
    { value: "admin", label: "Admin", description: "ควบคุมสิทธิ์ สาขา ทีม และความปลอดภัย", icon: ShieldCheck },
    { value: "commission", label: "คอมมิชชั่น", description: "จัดการฐานเงินเดือนและเปอร์เซ็นต์ส่วนแบ่ง", icon: CircleDollarSign },
  ];

  const TabItem = ({ value, label, icon: Icon }: { value: string; label: string; icon: LucideIcon }) => (
    <TabsTrigger
      value={value}
      onClick={() => handleTabChange(value)}
      className="group relative rounded-lg py-2.5 px-4 transition-all duration-300
                 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-[0_4px_20px_-4px_rgba(79,70,229,0.2)]
                 hover:bg-white/60 text-slate-500 font-semibold text-sm flex items-center gap-2.5 border border-transparent
                 data-[state=active]:border-indigo-100/50"
    >
      <Icon className={`h-4.5 w-4.5 transition-all duration-300 group-hover:scale-110 
                       ${activeTab === value ? "text-indigo-600 rotate-3" : "text-slate-400 group-hover:text-indigo-400"}`} />
      <span className="hidden md:inline-block tracking-tight">{label}</span>
      {activeTab === value && (
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-600" />
      )}
    </TabsTrigger>
  );

  return (
    <div className="relative w-full group">
      {/* 🖥️ Desktop View (Scrollable Tabs) */}
      <div className="hidden xl:block">
        <div className="absolute left-0 top-0 bottom-4 w-12 bg-linear-to-r from-slate-50 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-linear-to-l from-slate-50 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
          <TabsList className="flex items-center w-max md:w-full h-auto p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl gap-1.5 border border-slate-200/60 shadow-inner">
            {tabs.map((tab) => (
              <TabItem key={tab.value} value={tab.value} label={tab.label} icon={tab.icon} />
            ))}
          </TabsList>
        </div>
      </div>

      {/* 📱 Mobile View (Card List) */}
      <div className="xl:hidden space-y-3">
        <TabsList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full h-auto bg-transparent gap-3 border-none p-0 shadow-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300 text-left",
                  isActive 
                    ? "bg-white border-indigo-100 shadow-[0_4px_20px_-8px_rgba(79,70,229,0.2)] text-indigo-600" 
                    : "bg-white/40 border-slate-100/50 text-slate-500 hover:bg-white/60"
                )}
              >
                <div className={cn(
                  "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-colors shadow-xs",
                  isActive ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-semibold text-base transition-colors",
                    isActive ? "text-indigo-900" : "text-slate-700"
                  )}>
                    {tab.label}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 line-clamp-1 italic">
                    {tab.description}
                  </p>
                </div>
                {isActive && (
                  <div className="h-5 w-5 rounded-full bg-indigo-50 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-600" />
                  </div>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </div>
  );
}
