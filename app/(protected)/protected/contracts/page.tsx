import { requireAuthContext, assertStaff } from "@/lib/authz";
import { ContractsTable } from "@/features/contracts/components/ContractsTable";
import { CreateContractDialog } from "@/features/contracts/components/CreateContractDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ContractStats } from "@/features/contracts/components/ContractStats";
import { getContractStatus } from "@/features/contracts/utils";
import { RentalContractWithRelations } from "@/features/contracts/types";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";

import { getContracts } from "@/features/contracts/queries";
import { mapDbError } from "@/lib/db-error";
import { StatsTimeFilter } from "../../../../components/dashboard/StatsTimeFilter";

interface RentalContractsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RentalContractsPage({
  searchParams,
}: RentalContractsPageProps) {
  const { role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const params = await searchParams;
  const timeRange = (params.timeRange as string) || "all";

  // Fetch contracts using centralized query with multi-tenancy logic
  // requireAuthContext already handles the active_tenant_id cookie (including "ALL" for all branches)
  const { data, count, error } = await getContracts({
    tenantId: tenantId,
    timeRange,
  });

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading contracts: {mapDbError(error)}
      </div>
    );
  }

  const contracts = (data as unknown as RentalContractWithRelations[]) || [];
  const expiringSoonContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "expiring-soon",
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Premium Header */}
      <PageHeader
        title="สัญญาเช่า (Contracts)"
        subtitle="จัดการและติดตามสัญญาเช่าทั้งหมด"
        count={contracts.length}
        icon="fileText"
        gradient="emerald"
        actionSlot={<CreateContractDialog />}
      />

      {/* Time Filter for Stats */}
      <StatsTimeFilter />

      {/* Statistics Cards */}
      <ContractStats contracts={contracts} />

      {/* Contracts Table */}
      <ContractsTable 
        contracts={contracts} 
        totalCount={count} 
        filters={{ timeRange }} 
      />

      {/* Quick Stats Footer */}
      {contracts.length > 0 && (
        <TableFooterStats
          totalCount={contracts.length}
          unitLabel="สัญญา"
          secondaryStats={
            expiringSoonContracts > 0
              ? [
                  {
                    label: "สัญญาใกล้หมดอายุ",
                    value: expiringSoonContracts,
                    color: "orange",
                    icon: "clock",
                  },
                ]
              : []
          }
        />
      )}
    </div>
  );
}
