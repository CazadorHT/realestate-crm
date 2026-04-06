import {
  getRentNotificationRules,
  getLineGroups,
  getAllPropertiesSimple,
} from "@/features/rent-notifications/queries.server";
import { RuleList } from "@/features/rent-notifications/components/RuleList";
import { getActiveTenantCookie } from "@/lib/actions/tenant-context";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AddRuleDialog } from "@/features/rent-notifications/components/AddRuleDialog";

interface RentNotificationsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function RentNotificationsPage(
  props: RentNotificationsPageProps,
) {
  const searchParams = await props.searchParams;
  const tenantId = await getActiveTenantCookie();
  const page = Number(searchParams.page) || 1;
  const searchTerm = searchParams.search || "";
  const pageSize = 20;

  const { rules, count: totalCount } = await getRentNotificationRules(
    page,
    pageSize,
    tenantId,
    searchTerm,
  );
  const groups = await getLineGroups(tenantId);
  const properties = await getAllPropertiesSimple(tenantId);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="แจ้งเตือนสิ้นสุดสัญญาเช่า"
        subtitle="ตั้งค่าการแจ้งเตือนอัตโนมัติไปยังกลุ่ม LINE เมื่อสัญญาเช่าใกล้สิ้นสุด"
        count={totalCount}
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <RuleList
          initialRules={rules}
          groups={groups}
          properties={properties}
          tenantId={tenantId}
          totalCount={totalCount}
          currentPage={page}
        />
      </div>
    </div>
  );
}
