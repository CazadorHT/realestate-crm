"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatThaiCurrency } from "@/lib/excel-export";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  trend: string;
  color: "blue" | "emerald" | "indigo" | "amber";
  isCurrency?: boolean;
  suffix?: string;
  compareValue?: number | null;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color,
  isCurrency = true,
  suffix = "",
  compareValue,
}: StatsCardProps) {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
  };

  return (
    <Card className="border-0 shadow-sm bg-white overflow-hidden relative group transition-all hover:shadow-md">
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full",
          color === "blue" && "bg-blue-500",
          color === "emerald" && "bg-emerald-500",
          color === "indigo" && "bg-indigo-500",
          color === "amber" && "bg-amber-500",
        )}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        <div
          className={cn(
            "p-2 rounded-xl transition-transform group-hover:scale-110",
            colorMap[color],
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {isCurrency ? formatThaiCurrency(value) : value.toLocaleString()}
            {suffix}
          </div>
          {compareValue !== undefined && compareValue !== null && (
            <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              VS {isCurrency ? formatThaiCurrency(compareValue) : compareValue.toLocaleString()}
              {suffix}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
        <div className="mt-4 flex items-center text-[10px] font-bold uppercase tracking-wider">
          <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
          <span className="text-emerald-600">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
