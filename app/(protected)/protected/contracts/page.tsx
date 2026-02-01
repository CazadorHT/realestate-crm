import { requireAuthContext, assertStaff } from "@/lib/authz";
import { Clock } from "lucide-react";
import { ContractsTable } from "@/features/contracts/components/ContractsTable";
import { CreateContractDialog } from "@/features/contracts/components/CreateContractDialog";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ContractStats } from "@/features/contracts/components/ContractStats";
import { getContractStatus } from "@/features/contracts/utils";

type RentalContractWithRelations = {
  id: string;
  contract_number: string;
  tenant_name: string;
  tenant_phone: string | null;
  tenant_email: string | null;
  start_date: string;
  end_date: string;
  duration_months: number | null;
  monthly_rent: number | null;
  deposit_amount: number | null;
  deal_id: string;
  deal: {
    id: string;
    property: {
      title: string;
    } | null;
  } | null;
};

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
    <div className="p-6 space-y-6">
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
        <div className="flex items-center justify-between text-sm text-slate-500 px-2">
          <div className="flex items-center gap-4">
            <span>แสดงทั้งหมด {contracts.length} สัญญา</span>
            {expiringSoonContracts > 0 && (
              <span className="flex items-center gap-1 text-orange-600 font-medium">
                <Clock className="h-4 w-4" />
                {expiringSoonContracts} สัญญาใกล้หมดอายุ
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs">
              อัพเดทล่าสุด: {new Date().toLocaleDateString("th-TH")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
