import { requireAuthContext, assertStaff } from "@/lib/authz";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { ContractsTable } from "@/features/contracts/components/ContractsTable";

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

function getContractStatus(endDate: string) {
  const now = new Date();
  const end = new Date(endDate);
  const daysUntilExpiry = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return {
      status: "expired",
      label: "หมดอายุ",
      variant: "destructive" as const,
      days: daysUntilExpiry,
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      status: "expiring-soon",
      label: "ใกล้หมดอายุ",
      variant: "default" as const,
      days: daysUntilExpiry,
    };
  } else {
    return {
      status: "active",
      label: "ใช้งาน",
      variant: "default" as const,
      days: daysUntilExpiry,
    };
  }
}

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
    `
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

  // Calculate statistics
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "active"
  ).length;
  const expiringSoonContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "expiring-soon"
  ).length;
  const expiredContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "expired"
  ).length;

  const totalMonthlyRevenue = contracts
    .filter(
      (c) => getContractStatus(c.end_date).status === "active" && c.monthly_rent
    )
    .reduce((sum, c) => sum + (c.monthly_rent || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            สัญญาเช่า
          </h1>
          <p className="text-slate-500 mt-2">จัดการและติดตามสัญญาเช่าทั้งหมด</p>
        </div>
        <Button asChild>
          <Link href="/protected/deals">
            <Plus className="mr-2 h-4 w-4" /> สร้างสัญญาใหม่
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สัญญาทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContracts}</div>
            <p className="text-xs text-slate-500 mt-1">Total contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ใช้งานอยู่</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeContracts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ใกล้หมดอายุ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {expiringSoonContracts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Expiring in 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หมดอายุแล้ว</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {expiredContracts}
            </div>
            <p className="text-xs text-slate-500 mt-1">Expired contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายได้/เดือน</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat("th-TH", {
                style: "currency",
                currency: "THB",
                maximumFractionDigits: 0,
              }).format(totalMonthlyRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">From active contracts</p>
          </CardContent>
        </Card>
      </div>

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
