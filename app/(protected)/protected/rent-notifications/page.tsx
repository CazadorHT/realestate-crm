import { 
  getRentNotificationRules, 
  getLineGroups, 
  getAllPropertiesSimple,
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

  const [authContext] = await Promise.all([
    requireAuthContext(),
  ]);

  const { tenantId } = authContext;

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
    <RentNotificationsPageView
      rules={rules}
      rulesCount={rulesCount}
      history={history}
      historyCount={historyCount}
      groups={groups}
      properties={properties}
      tenantId={tenantId || null}
      page={page}
      currentTab={currentTab}
    />
  );
}


