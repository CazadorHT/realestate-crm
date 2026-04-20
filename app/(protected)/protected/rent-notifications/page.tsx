import { 
  getRentNotificationRules, 
  getLineGroups, 
  getAllPropertiesSimple,
  getRentNotificationHistory
} from "@/features/rent-notifications/queries.server";
import { RuleList } from "@/features/rent-notifications/components/RuleList";
import { HistoryList } from "@/features/rent-notifications/components/HistoryList";
import { AddRuleDialog } from "@/features/rent-notifications/components/AddRuleDialog";
import { requireAuthContext } from "@/lib/authz";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Bell, 
  History, 
  Settings2,
  CalendarDays
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Suspense } from "react";

export default async function RentNotificationsPage(props: {
  searchParams: Promise<{ page?: string; search?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";
  const currentTab = searchParams.tab || "rules";

  // [PERFORMANCE] Parallel Fetching: Core Auth & Global Context
  const [authContext] = await Promise.all([
    requireAuthContext(),
  ]);

  const { tenantId } = authContext;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* 🚀 1. HEADER (Static / Fast stream for Dialog data) */}
      <Suspense fallback={<div className="h-20 animate-pulse bg-slate-50 rounded-2xl" />}>
        <PageHeaderWrapper tenantId={tenantId} />
      </Suspense>

      {/* 🚀 2. MAIN CONTENT (Tabs & Lists) */}
      <Tabs defaultValue={currentTab} className="w-full">
        <Suspense fallback={<div className="h-11 w-full max-w-md bg-slate-100 animate-pulse rounded-xl" />}>
          <TabsListWrapper page={page} tenantId={tenantId} search={search} currentTab={currentTab} />
        </Suspense>

        <div className="mt-8">
          <Suspense fallback={<div className="h-96 animate-pulse bg-slate-50 rounded-2xl" />}>
            <TabsContentWrapper 
              page={page} 
              tenantId={tenantId} 
              search={search} 
              currentTab={currentTab} 
            />
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}

/** 🚀 RENT NOTIFICATIONS PERFORMANCE WRAPPERS */

async function PageHeaderWrapper({ tenantId }: { tenantId: string | undefined }) {
  const [groups, properties] = await Promise.all([
    getLineGroups(tenantId),
    getAllPropertiesSimple(tenantId),
  ]);

  return (
    <PageHeader
      title="การแจ้งเตือนค่าเช่า"
      subtitle="ตั้งค่าบอทเพื่อส่งแจ้งเตือนชำระค่าเช่าอัตโนมัติไปยังกลุ่ม LINE"
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
  );
}

async function TabsListWrapper({ 
  page, 
  tenantId, 
  search,
  currentTab
}: { 
  page: number; 
  tenantId: string | undefined; 
  search: string;
  currentTab: string;
}) {
  const [{ count: rulesCount }, { count: historyCount }] = await Promise.all([
    getRentNotificationRules(page, 20, tenantId, search),
    getRentNotificationHistory(page, 20, tenantId),
  ]);

  return (
    <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl h-11">
      <TabsTrigger 
        value="rules" 
        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 font-bold transition-all text-xs"
      >
        <Settings2 className="w-4 h-4" />
        กฎการแจ้งเตือน ({rulesCount})
      </TabsTrigger>
      <TabsTrigger 
        value="history" 
        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 font-bold transition-all text-xs"
      >
        <History className="w-4 h-4" />
        ประวัติการส่ง ({historyCount})
      </TabsTrigger>
    </TabsList>
  );
}

async function TabsContentWrapper({
  page,
  tenantId,
  search,
  currentTab
}: {
  page: number;
  tenantId: string | undefined;
  search: string;
  currentTab: string;
}) {
  // We only fetch what's visible or relevant. For simplicity in streaming, we can do both in parallel.
  const [
    { rules, count: rulesCount },
    groups,
    properties,
    { history, count: historyCount }
  ] = await Promise.all([
    getRentNotificationRules(page, 20, tenantId, search),
    getLineGroups(tenantId),
    getAllPropertiesSimple(tenantId),
    getRentNotificationHistory(page, 20, tenantId)
  ]);

  return (
    <>
      <TabsContent value="rules" className="m-0 focus-visible:ring-0">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-1">
          <RuleList
            initialRules={rules}
            groups={groups}
            properties={properties}
            tenantId={tenantId || null}
            totalCount={rulesCount}
            currentPage={page}
          />
        </div>
      </TabsContent>

      <TabsContent value="history" className="m-0 focus-visible:ring-0">
        <HistoryList
          initialHistory={history as any}
          totalCount={historyCount}
          currentPage={page}
        />
      </TabsContent>
    </>
  );
}

