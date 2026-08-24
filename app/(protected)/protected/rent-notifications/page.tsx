import { 
  getRentNotificationRules, 
  getLineGroups, 
  getRentNotificationHistory
} from "@/features/rent-notifications/queries.server";
import { RentNotificationsPageView } from "@/features/rent-notifications/components/RentNotificationsPageView";
import { requireAuthContext } from "@/lib/authz";
import { Suspense } from "react";

export default async function RentNotificationsPage(props: {
  searchParams: Promise<{ page?: string; search?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";
  const currentTab = searchParams.tab || "rules";

  const authContext = await requireAuthContext();
  const { tenantId } = authContext;

  // ⚡ Tab-conditional data fetching to eliminate redundant queries:
  // 1. Fetch rules only when on rules tab
  const rulesPromise = currentTab === "rules"
    ? getRentNotificationRules(page, 20, tenantId, search)
    : Promise.resolve({ rules: [], count: 0 });

  // 2. Fetch history only when on history tab
  const historyPromise = currentTab === "history"
    ? getRentNotificationHistory(page, 20, tenantId)
    : Promise.resolve({ history: [], count: 0 });

  const [
    { rules, count: rulesCount },
    { history, count: historyCount },
    groups,
  ] = await Promise.all([
    rulesPromise,
    historyPromise,
    getLineGroups(tenantId),
  ]);

  return (
    <RentNotificationsPageView
      rules={rules}
      rulesCount={rulesCount}
      history={history}
      historyCount={historyCount}
      groups={groups}
      properties={[]}
      tenantId={tenantId || null}
      page={page}
      currentTab={currentTab}
    />
  );
}


