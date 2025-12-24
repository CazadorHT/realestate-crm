import { getDeals } from "@/features/deals/queries.getDeals";
import { getPropertiesForSelect } from "@/features/properties/queries";
import { DealsTable } from "@/features/deals/DealsTable";
import { requireAuthContext } from "@/lib/authz";

export const metadata = {
  title: "Deals",
};

export default async function DealsPage() {
  await requireAuthContext();

  const { data, count } = await getDeals({ page: 1, pageSize: 20 });
  const properties = await getPropertiesForSelect();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-muted-foreground">จัดการดีลทั้งหมด</p>
        </div>
      </div>

      <DealsTable initialData={data} initialCount={count} initialPage={1} pageSize={20} properties={properties} />
    </div>
  );
}
