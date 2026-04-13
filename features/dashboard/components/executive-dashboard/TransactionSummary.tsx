"use client";

import React from "react";
import { ExecutiveStats, QuarterlyRevenue } from "../../executive-queries";
import { QuarterlyBreakdown } from "./QuarterlyBreakdown";
import { TransactionTable } from "./TransactionTable";

interface TransactionSummaryProps {
  stats: ExecutiveStats;
  quarterlyData: QuarterlyRevenue[];
}

export function TransactionSummary({
  stats,
  quarterlyData,
}: TransactionSummaryProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-7">
      {/* Quarterly Breakdown */}
      <QuarterlyBreakdown 
        stats={stats} 
        quarterlyData={quarterlyData}
        className="lg:col-span-3"
      />

      {/* Transaction Volume Table/Summary */}
      <TransactionTable 
        stats={stats}
        className="lg:col-span-4" 
      />
    </div>
  );
}
