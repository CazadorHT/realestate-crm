"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, History } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useLanguage } from "@/lib/i18n/language-context";
import { RuleList } from "./RuleList";
import { HistoryList } from "./HistoryList";
import { AddRuleDialog } from "./AddRuleDialog";
import { RentNotificationRule, LINEGroup, SimpleProperty } from "../types";

interface RentNotificationsPageViewProps {
  rules: RentNotificationRule[];
  rulesCount: number;
  history: any[];
  historyCount: number;
  groups: LINEGroup[];
  properties?: SimpleProperty[];
  tenantId: string | null;
  page: number;
  currentTab: string;
}

export function RentNotificationsPageView({
  rules,
  rulesCount,
  history,
  historyCount,
  groups,
  properties = [],
  tenantId,
  page,
  currentTab,
}: RentNotificationsPageViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isEn = language === "en";

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in font-sarabun">
      {/* 🚀 1. HEADER */}
      <PageHeader
        title={isEn ? "Rent Notifications" : "การแจ้งเตือนค่าเช่า"}
        subtitle={
          isEn
            ? "Configure automated LINE bot reminders for rent payments and lease expirations"
            : "ตั้งค่าบอทเพื่อส่งแจ้งเตือนชำระค่าเช่าอัตโนมัติไปยังกลุ่ม LINE"
        }
        icon="bell"
        gradient="blue"
        actionSlot={
          <AddRuleDialog
            groups={groups}
            properties={properties}
            tenantId={tenantId}
          />
        }
      />

      {/* 🚀 2. MAIN CONTENT (Tabs & Lists) */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl h-11">
          <TabsTrigger
            value="rules"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 font-bold transition-all text-xs"
          >
            <Settings2 className="w-4 h-4" />
            {isEn ? `Alert Rules (${rulesCount})` : `กฎการแจ้งเตือน (${rulesCount})`}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 font-bold transition-all text-xs"
          >
            <History className="w-4 h-4" />
            {isEn ? `History (${historyCount})` : `ประวัติการส่ง (${historyCount})`}
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="rules" className="m-0 focus-visible:ring-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-1">
              <RuleList
                initialRules={rules}
                groups={groups}
                properties={properties}
                tenantId={tenantId}
                totalCount={rulesCount}
                currentPage={page}
              />
            </div>
          </TabsContent>

          <TabsContent value="history" className="m-0 focus-visible:ring-0">
            <HistoryList
              initialHistory={history}
              totalCount={historyCount}
              currentPage={page}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
