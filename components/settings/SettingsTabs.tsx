"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

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

  return (
    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1">
      <TabsTrigger
        value="general"
        onClick={() => handleTabChange("general")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
      >
        ทั่วไป
      </TabsTrigger>
      <TabsTrigger
        value="social"
        onClick={() => handleTabChange("social")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
      >
        Social
      </TabsTrigger>
      <TabsTrigger
        value="ai"
        onClick={() => handleTabChange("ai")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
      >
        AI Tools
      </TabsTrigger>
      <TabsTrigger
        value="admin"
        onClick={() => handleTabChange("admin")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
      >
        Admin
      </TabsTrigger>
    </TabsList>
  );
}
