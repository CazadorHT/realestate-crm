import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractStatus } from "@/features/contracts/utils";

interface ContractStatsProps {
  contracts: any[];
}

export function ContractStats({ contracts }: ContractStatsProps) {
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "active",
  ).length;
  const expiringSoonContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "expiring-soon",
  ).length;
  const expiredContracts = contracts.filter(
    (c) => getContractStatus(c.end_date).status === "expired",
  ).length;

  const totalMonthlyRevenue = contracts
    .filter(
      (c) =>
        getContractStatus(c.end_date).status === "active" && c.monthly_rent,
    )
    .reduce((sum: number, c: any) => sum + (c.monthly_rent || 0), 0);

  return (
    <div className="grid gap-4  md:grid-cols-2 lg:grid-cols-5">
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
  );
}
