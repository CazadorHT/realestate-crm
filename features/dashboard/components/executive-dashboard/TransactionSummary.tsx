"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatThaiCurrency } from "@/lib/excel-export";
import { ExecutiveStats, QuarterlyRevenue } from "../../executive-queries";

interface TransactionSummaryProps {
  stats: ExecutiveStats;
  quarterlyData: QuarterlyRevenue[];
}

export function TransactionSummary({
  stats,
  quarterlyData,
}: TransactionSummaryProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      {/* Quarterly Breakdown */}
      <Card className="lg:col-span-3 border-slate-100 shadow-sm border-0 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-indigo-500" />
            สรุปรายไตรมาส (Quarterly)
          </CardTitle>
          <CardDescription>
            ผลงานแยกตามไตรมาสของปีปัจจุบัน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {quarterlyData.map((q) => (
              <div key={q.quarter} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    {q.quarter}
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatThaiCurrency(q.total)}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min((q.total / stats.totalRevenue) * 100, 100) || 0}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Sales: {formatThaiCurrency(q.sales)}</span>
                  <span>Rent: {formatThaiCurrency(q.rent)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Volume Table/Summary */}
      <Card className="lg:col-span-4 border-slate-100 shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">
              Transaction Overview
            </CardTitle>
            <CardDescription>
              ตารางสรุปจำนวนดีลและมูลค่าตามประเภทธุรกรรม
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-4 font-semibold">
                    ประเภทธุรกรรม
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    จำนวนดีล
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    ยอดรวม (Gross Value)
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">
                    ค่าคอมมิชชั่น
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    การขาย (Sales)
                  </td>
                  <td className="px-6 py-4 text-center">
                    {stats.salesCount}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">
                    {formatThaiCurrency(stats.salesRevenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-blue-600 font-bold">
                    {formatThaiCurrency(stats.salesCommission)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    การเช่า (Rentals)
                  </td>
                  <td className="px-6 py-4 text-center">
                    {stats.rentalCount}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">
                    {formatThaiCurrency(stats.rentalRevenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-600 font-bold">
                    {formatThaiCurrency(stats.rentalCommission)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50/50 font-bold border-t border-slate-200">
                <tr>
                  <td className="px-6 py-4">Total</td>
                  <td className="px-6 py-4 text-center">
                    {stats.totalDeals}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {formatThaiCurrency(stats.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-900 bg-slate-100/50">
                    {formatThaiCurrency(stats.totalCommission)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
