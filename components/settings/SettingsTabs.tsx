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
      {/* 📱 Mobile Scroll Hint: Fade Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-4 w-12 bg-linear-to-r from-slate-50 to-transparent z-10 pointer-events-none md:hidden opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 bottom-4 w-12 bg-linear-to-l from-slate-50 to-transparent z-10 pointer-events-none md:hidden opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="w-full overflow-x-auto pb-4 scrollbar-hide mask-[linear-gradient(to_right,white_90%,transparent)] md:mask-none">
        <TabsList className="flex items-center w-max md:w-full h-auto p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl gap-1.5 border border-slate-200/60 shadow-inner">
          <TabItem value="general" label="ทั่วไป" icon={Settings} />
          <TabItem value="branding" label="แบรนด์" icon={Palette} />
          <TabItem value="social" label="Social" icon={Share2} />
          <TabItem value="ai" label="AI Tools" icon={Cpu} />
          <TabItem value="admin" label="Admin" icon={ShieldCheck} />
          <TabItem value="commission" label="คอมมิชชั่น" icon={CircleDollarSign} />
        </TabsList>
      </div>
    </div>
  );
}
