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
    <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-auto h-auto p-1 bg-slate-100 rounded-xl gap-1">
      <TabsTrigger
        value="general"
        onClick={() => handleTabChange("general")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
      >
        ทั่วไป
      </TabsTrigger>
      <TabsTrigger
        value="branding"
        onClick={() => handleTabChange("branding")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
      >
        แบรนด์
      </TabsTrigger>
      <TabsTrigger
        value="social"
        onClick={() => handleTabChange("social")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
      >
        Social
      </TabsTrigger>
      <TabsTrigger
        value="ai"
        onClick={() => handleTabChange("ai")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
      >
        AI Tools
      </TabsTrigger>
      <TabsTrigger
        value="admin"
        onClick={() => handleTabChange("admin")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
      >
        Admin
      </TabsTrigger>
      <TabsTrigger
        value="commission"
        onClick={() => handleTabChange("commission")}
        className="rounded-lg py-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
      >
        คอมมิชชั่น
      </TabsTrigger>
    </TabsList>
  );
}
