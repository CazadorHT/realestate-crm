import { 
  getRentNotificationRules, 
  getLineGroups, 
  getAllPropertiesSimple,
  getRentNotificationHistory
} from "@/features/rent-notifications/queries.server";
import { RuleList } from "@/features/rent-notifications/components/RuleList";
import { HistoryList } from "@/features/rent-notifications/components/HistoryList";
import { AddRuleDialog } from "@/features/rent-notifications/components/AddRuleDialog";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";
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

export default async function RentNotificationsPage(props: {
  searchParams: Promise<{ page?: string; search?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";
  const currentTab = searchParams.tab || "rules";
  const tenantId = await getActiveTenantCookie();

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
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
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
      <Tabs defaultValue={currentTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1 rounded-xl h-11">
          <TabsTrigger value="rules" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 font-bold transition-all text-xs">
            <Settings2 className="w-4 h-4" />
            กฎการแจ้งเตือน ({rulesCount})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 font-bold transition-all text-xs">
            <History className="w-4 h-4" />
            ประวัติการส่ง ({historyCount})
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
              initialHistory={history as any}
              totalCount={historyCount}
              currentPage={page}
            />
          </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}
