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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      {/* Quarterly Breakdown */}
      <QuarterlyBreakdown 
        stats={stats} 
        quarterlyData={quarterlyData} 
      />

      {/* Transaction Volume Table/Summary */}
      <TransactionTable stats={stats} />
    </div>
  );
}
