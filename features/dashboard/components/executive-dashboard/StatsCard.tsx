"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatThaiCurrency } from "@/lib/excel-export";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  trend: string;
  trendValue?: number; // Numeric trend for logic
  isInverse?: boolean; // If lower is better
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
  trendValue = 0,
  isInverse = false,
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

  // Elite Trend Logic
  const isPositive = isInverse ? trendValue < 0 : trendValue > 0;
  const isNeutral = trendValue === 0 || trend === "0%" || trend.includes("No comparison");
  
  const TrendIcon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;
  const trendColorClass = isNeutral 
    ? "text-slate-500 bg-slate-50" 
    : isPositive 
      ? "text-emerald-600 bg-emerald-50" 
      : "text-rose-600 bg-rose-50";

  return (
    <Card className="border-0 shadow-sm bg-white overflow-hidden relative group transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div
        className={cn(
          "absolute top-0 left-0 w-1 h-full transition-colors duration-300",
          color === "blue" && "bg-blue-500",
          color === "emerald" && "bg-emerald-500",
          color === "indigo" && "bg-indigo-500",
          color === "amber" && "bg-amber-500",
        )}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 xs:px-6">
        <CardTitle className="text-xs xs:text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        <div
          className={cn(
            "p-1.5 xs:p-2 rounded-xl transition-all duration-300 group-hover:scale-110",
            colorMap[color],
          )}
        >
          <Icon className="w-4 h-4 xs:w-5 xs:h-5" />
        </div>
      </CardHeader>
      <CardContent className="px-4 xs:px-6">
        <div className="flex flex-col xs:flex-row xs:items-baseline justify-between gap-1 xs:gap-2">
          <div className="text-xl xs:text-2xl font-bold text-slate-900 tracking-tight shrink-0">
            {isCurrency ? formatThaiCurrency(value) : value.toLocaleString()}
            {suffix}
          </div>
          {compareValue !== undefined && compareValue !== null && (
            <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-lg border border-indigo-100 truncate max-w-full xs:max-w-[120px] self-start xs:self-auto">
              VS {isCurrency ? formatThaiCurrency(compareValue) : compareValue.toLocaleString()}
              {suffix}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{description}</p>
        
        <div 
          className={cn(
            "mt-4 inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
            trendColorClass
          )}
          role="img"
          aria-label={`Trend: ${isNeutral ? 'Neutral' : isPositive ? 'Growing' : 'Declining'} at ${trend}`}
        >
          <TrendIcon className="mr-1 h-3.5 w-3.5" />
          <span>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
