"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Building2, Target, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExecutiveData } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

interface ExecutiveBranchListProps {
  data: ExecutiveData[];
  isLoading: boolean;
}

// 🛡️ Premium Skeleton Rows (Elite Symphony)
const TableSkeleton = () =>
  Array(5)
    .fill(0)
    .map((_, i) => (
      <TableRow
        key={i}
        className="animate-pulse border-b border-slate-50 h-20"
      >
        <TableCell className="px-6 py-4">
          <div className="h-6 w-40 bg-slate-100 rounded-lg" />
        </TableCell>
        <TableCell className="text-right">
          <div className="h-6 w-12 bg-slate-100 rounded-md ml-auto" />
        </TableCell>
        <TableCell className="text-right">
          <div className="h-6 w-12 bg-slate-100 rounded-md ml-auto" />
        </TableCell>
        <TableCell className="px-6 text-right">
          <div className="h-8 w-24 bg-slate-100 rounded-full ml-auto" />
        </TableCell>
      </TableRow>
    ));

const CardSkeleton = () =>
  Array(3)
    .fill(0)
    .map((_, i) => (
      <div key={i} className="p-5 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-6 w-40 bg-slate-100 rounded-lg" />
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="h-3 w-12 bg-slate-50 rounded" />
            <div className="h-5 w-16 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-12 bg-slate-50 rounded" />
            <div className="h-5 w-16 bg-slate-100 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-12 bg-slate-50 rounded" />
            <div className="h-5 w-16 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    ));

export function ExecutiveBranchList({
  data,
  isLoading,
}: ExecutiveBranchListProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  // 🛡️ Consolidated Performance Logic (DRY)
  const getBranchPerformance = (row: ExecutiveData) => {
    const rate = row.leadCount > 0 ? (row.dealCount / row.leadCount) * 100 : 0;

    let color = "text-rose-600 bg-rose-50 border-rose-100";
    let dot = "bg-rose-500 text-white";
    let label = isEn ? "⚠️ Attention" : "⚠️ Attention";

    if (rate >= 20) {
      color = "text-emerald-600 bg-emerald-50 border-emerald-100";
      dot = "bg-emerald-500";
      label = isEn ? "🔥 Top Star" : "🔥 Top Star";
    } else if (rate >= 10) {
      color = "text-amber-600 bg-amber-50 border-amber-100";
      dot = "bg-amber-500";
      label = isEn ? "⚡ Normal" : "⚡ Normal";
    }

    return { rate, color, dot, label };
  };

  return (
    <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-4 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-400" />
              {isEn ? "Branch Performance Matrix" : "รายละเอียดประสิทธิภาพรายสาขา"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isEn ? "Detailed comparative branch KPI analysis" : "ข้อมูลวิเคราะห์ประสิทธิภาพเปรียบเทียบเชิงลึก"}
            </CardDescription>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500" /> High
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-amber-500" /> Mid
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-rose-500" /> Low
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-100 font-semibold uppercase tracking-wider">
                <TableHead className="px-6 py-4 text-slate-600 text-[11px]">
                  {isEn ? "Branch Name" : "ชื่อสาขา"}
                </TableHead>
                <TableHead className="text-right text-slate-600 text-[11px]">
                  Leads
                </TableHead>
                <TableHead className="text-right text-slate-600 text-[11px]">
                  Won Deals
                </TableHead>
                <TableHead className="text-right text-slate-600 text-[11px] px-6">
                  Conversion Rate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                data.map((row) => {
                  const { rate, color, dot } = getBranchPerformance(row);
                  return (
                    <TableRow
                      key={row.tenantId}
                      className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <TableCell className="px-6 py-4 font-semibold text-slate-700 text-sm flex items-center gap-3">
                        <div className={cn("h-2 w-2 rounded-full", dot)} />
                        {row.tenantName}
                      </TableCell>
                      <TableCell className="text-right text-slate-600 font-medium">
                        {row.leadCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        {row.dealCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold",
                            color,
                          )}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {rate.toFixed(1)}%
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <CardSkeleton />
          ) : (
            data.map((row) => {
              const { rate, color, dot, label } = getBranchPerformance(row);
              return (
                <div
                  key={row.tenantId}
                  className="p-5 space-y-4 hover:bg-slate-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", dot)} />
                      <span className="font-semibold text-slate-800 text-base">
                        {row.tenantName}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase",
                        color,
                      )}
                    >
                      {label}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Users className="h-3 w-3" /> Leads
                      </span>
                      <p className="text-sm font-semibold text-slate-700">
                        {row.leadCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Target className="h-3 w-3" /> Won
                      </span>
                      <p className="text-sm font-semibold text-slate-700">
                        {row.dealCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Rate
                      </span>
                      <p
                        className={cn(
                          "text-sm font-semibold text-rose-600",
                          color.split(" ")[0],
                        )}
                      >
                        {rate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {data.length === 0 && !isLoading && (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm italic">
            {isEn ? "No branch performance data to display" : "ไม่พบข้อมูลสาขาที่ต้องการแสดง"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

