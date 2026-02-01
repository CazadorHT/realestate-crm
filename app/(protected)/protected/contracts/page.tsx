import { requireAuthContext, assertStaff } from "@/lib/authz";
import { ContractsTable } from "@/features/contracts/components/ContractsTable";
import { CreateContractDialog } from "@/features/contracts/components/CreateContractDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ContractStats } from "@/features/contracts/components/ContractStats";
import { getContractStatus } from "@/features/contracts/utils";
import { RentalContractWithRelations } from "@/features/contracts/types";
import { TableFooterStats } from "@/components/dashboard/TableFooterStats";

export default async function RentalContractsPage() {
  const { supabase, role } = await requireAuthContext();
  assertStaff(role);

  // Fetch contracts with deal info
  const { data, error } = await supabase
    .from("rental_contracts")
    .select(
      `
      *,
      deal:deals(
        id,
        property:properties(title)
      )
    `,
    )
    .order("start_date", { ascending: false });

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading contracts: {error.message}
      </div>
    );
  }

  const contracts = (data as unknown as RentalContractWithRelations[]) || [];
  const expiringSoonContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "expiring-soon",
  ).length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Premium Header */}
      <PageHeader
        title="สัญญาเช่า (Contracts)"
        subtitle="จัดการและติดตามสัญญาเช่าทั้งหมด"
        count={contracts.length}
        icon="fileText"
        gradient="emerald"
        actionSlot={<CreateContractDialog />}
      />

      {/* Statistics Cards */}
      <ContractStats contracts={contracts} />

      {/* Contracts Table */}
      <ContractsTable contracts={contracts} />

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
