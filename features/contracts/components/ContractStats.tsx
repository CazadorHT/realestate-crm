"use client";

import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractStatus } from "@/features/contracts/utils";
import { RentalContractWithRelations } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

interface ContractStatsProps {
  contracts: RentalContractWithRelations[];
}

export function ContractStats({ contracts }: ContractStatsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

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
      (c) => getContractStatus(c.end_date).status === "active" && c.rent_price,
    )
    .reduce((sum: number, c) => sum + (c.rent_price || 0), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{isEn ? "Total Contracts" : "สัญญาทั้งหมด"}</CardTitle>
          <FileText className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalContracts}</div>
          <p className="text-xs text-slate-500 mt-1">{isEn ? "All registered contracts" : "สัญญาทั้งหมดในระบบ"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{isEn ? "Active" : "ใช้งานอยู่"}</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {activeContracts}
          </div>
          <p className="text-xs text-slate-500 mt-1">{isEn ? "Active contracts" : "สัญญาที่มีผลบังคับใช้"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{isEn ? "Expiring Soon" : "ใกล้หมดอายุ"}</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {expiringSoonContracts}
          </div>
          <p className="text-xs text-slate-500 mt-1">{isEn ? "Expiring in 30 days" : "หมดอายุภายใน 30 วัน"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{isEn ? "Expired" : "หมดอายุแล้ว"}</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {expiredContracts}
          </div>
          <p className="text-xs text-slate-500 mt-1">{isEn ? "Expired contracts" : "สัญญาที่สิ้นสุดแล้ว"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{isEn ? "Monthly Revenue" : "รายได้/เดือน"}</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
              style: "currency",
              currency: "THB",
              maximumFractionDigits: 0,
            }).format(totalMonthlyRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{isEn ? "From active contracts" : "จากสัญญาที่ใช้งานอยู่"}</p>
        </CardContent>
      </Card>
    </div>
  );
}

