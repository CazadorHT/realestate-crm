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

interface TransactionTableProps {
  stats: ExecutiveStats;
}

export function TransactionTable({ stats }: TransactionTableProps) {
  return (
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
  );
}
