"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Building2 } from "lucide-react";

interface ExecutiveStatsProps {
  totalLeads: number;
  totalDeals: number;
  branchCount: number;
  isLoading: boolean;
}

export function ExecutiveStats({
  totalLeads,
  totalDeals,
  branchCount,
  isLoading,
}: ExecutiveStatsProps) {
  // 🛡️ Premium Skeleton Template
  const StatSkeleton = () => (
    <div className="space-y-3">
      <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
      <div className="h-8 w-32 bg-slate-200 animate-pulse rounded" />
      <div className="h-3 w-40 bg-slate-100 animate-pulse rounded" />
    </div>
  );

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      {/* Global Leads Card */}
      <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50/30">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            ลีดทั้งหมด (Global Leads)
          </CardTitle>
          <div className="p-1.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <StatSkeleton />
          ) : (
            <>
              <div className="text-2xl font-semibold text-slate-900">
                {totalLeads.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                จาก {branchCount} สาขาทั่วประเทศ
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Won Deals Card */}
      <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50/30">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            ดีลที่ปิดได้ (Won Deals)
          </CardTitle>
          <div className="p-1.5 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
            <Briefcase className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <StatSkeleton />
          ) : (
            <>
              <div className="text-2xl font-semibold text-slate-900">
                {totalDeals.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                ความสำเร็จขององค์กร
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Branches Card */}
      <Card className="border-slate-100 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50/30">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            จำนวนสาขา (Active Branches)
          </CardTitle>
          <div className="p-1.5 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
            <Building2 className="h-4 w-4 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <StatSkeleton />
          ) : (
            <>
              <div className="text-2xl font-semibold text-slate-900">{branchCount}</div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                สาขาที่เปิดดำเนินการจริง
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
