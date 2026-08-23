"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { formatThaiCurrency } from "@/lib/excel-export";
import { ExecutiveStats } from "../../executive-queries";

import { PieChart as PieChartIcon, TrendingUp, Handshake, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface TransactionTableProps {
  stats: ExecutiveStats;
  className?: string;
}

export function TransactionTable({ stats, className }: TransactionTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <Card className={cn("border-slate-100 shadow-sm border-0 bg-white/50 backdrop-blur-sm", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          {isEn ? "Transaction Overview" : "ภาพรวมธุรกรรม (Transactions)"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isEn ? "Summary of closed deal volume and commission by transaction type" : "สรุปจำนวนดีลและมูลค่าแยกตามประเภทธุรกรรม"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Desktop View */}
        <div className="hidden lg:block relative overflow-x-auto rounded-xl border border-slate-100 bg-white/50">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-500 uppercase bg-slate-50/80 tracking-widest font-semibold">
              <tr>
                <th className="px-6 py-4 font-semibold">{isEn ? "Transaction Type" : "ประเภทธุรกรรม"}</th>
                <th className="px-6 py-4 font-semibold text-center">{isEn ? "Deals Count" : "จำนวนดีล"}</th>
                <th className="px-6 py-4 font-semibold text-right">{isEn ? "Gross Volume" : "ยอดรวม (Gross)"}</th>
                <th className="px-6 py-4 font-semibold text-right">{isEn ? "Commission" : "คอมมิชชั่น"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <TransactionRow
                label={isEn ? "Sales" : "การขาย (Sales)"}
                count={stats.salesCount}
                revenue={stats.salesRevenue}
                commission={stats.salesCommission}
                color="blue"
              />
              <TransactionRow
                label={isEn ? "Rentals" : "การเช่า (Rentals)"}
                count={stats.rentalCount}
                revenue={stats.rentalRevenue}
                commission={stats.rentalCommission}
                color="emerald"
              />
            </tbody>
            <tfoot className="bg-slate-50/80 font-semibold border-t border-slate-200">
              <tr>
                <td className="px-6 py-4 text-[10px] uppercase tracking-wider">Total Overall</td>
                <td className="px-6 py-4 text-center text-lg">{stats.totalDeals}</td>
                <td className="px-6 py-4 text-right text-slate-900">
                  {formatThaiCurrency(stats.totalRevenue)}
                </td>
                <td className="px-6 py-4 text-right text-blue-600 bg-blue-50/30">
                  {formatThaiCurrency(stats.totalCommission)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile View (S, M, L) */}
        <div className="lg:hidden space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TransactionMobileCard
              label={isEn ? "Sales" : "การขาย (Sales)"}
              count={stats.salesCount}
              revenue={stats.salesRevenue}
              commission={stats.salesCommission}
              icon={<TrendingUp className="h-4 w-4" />}
              color="blue"
            />
            <TransactionMobileCard
              label={isEn ? "Rentals" : "การเช่า (Rentals)"}
              count={stats.rentalCount}
              revenue={stats.rentalRevenue}
              commission={stats.rentalCommission}
              icon={<Handshake className="h-4 w-4" />}
              color="emerald"
            />
          </div>

          {/* Mobile Total Bar */}
          <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="h-16 w-16" />
            </div>
            <div className="relative z-10 flex flex-col xs:flex-row xs:items-center justify-between gap-3 xs:gap-0">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Total Summary
                </p>
                <p className="text-xl xs:text-2xl font-semibold mt-1">
                  {stats.totalDeals} <span className="text-xs font-normal text-slate-400">Deals</span>
                </p>
              </div>
              <div className="xs:text-right border-t xs:border-t-0 border-slate-800 pt-3 xs:pt-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Total Commission
                </p>
                <p className="text-lg xs:text-xl font-semibold text-blue-400 mt-1">
                  {formatThaiCurrency(stats.totalCommission)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionRow({
  label,
  count,
  revenue,
  commission,
  color,
}: {
  label: string;
  count: number;
  revenue: number;
  commission: number;
  color: "blue" | "emerald";
}) {
  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4 font-semibold text-slate-700">{label}</td>
      <td className="px-6 py-4 text-center font-semibold text-slate-900 text-base">{count}</td>
      <td className="px-6 py-4 text-right font-semibold text-slate-600">
        {formatThaiCurrency(revenue)}
      </td>
      <td className={cn(
        "px-6 py-4 text-right font-semibold",
        color === "blue" ? "text-blue-600" : "text-emerald-600"
      )}>
        {formatThaiCurrency(commission)}
      </td>
    </tr>
  );
}

function TransactionMobileCard({
  label,
  count,
  revenue,
  commission,
  icon,
  color,
}: {
  label: string;
  count: number;
  revenue: number;
  commission: number;
  icon: React.ReactNode;
  color: "blue" | "emerald";
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className={cn(
          "p-2 rounded-xl",
          color === "blue" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {icon}
        </div>
        <span className="text-2xl font-semibold text-slate-900">{count}</span>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label} Volume</p>
        <p className="text-lg font-semibold text-slate-800">{formatThaiCurrency(revenue)}</p>
      </div>
      <div className={cn(
        "p-2 rounded-lg flex items-center justify-between",
        color === "blue" ? "bg-blue-50/50" : "bg-emerald-50/50"
      )}>
        <span className="text-[10px] font-semibold text-slate-500 uppercase">Comm.</span>
        <span className={cn(
          "text-sm font-semibold",
          color === "blue" ? "text-blue-600" : "text-emerald-600"
        )}>
          {formatThaiCurrency(commission)}
        </span>
      </div>
    </div>
  );
}
