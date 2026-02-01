import React from "react";
import { Clock, Info } from "lucide-react";

interface StatItem {
  label: string;
  value: number | string;
  color?: "blue" | "orange" | "green" | "red" | "slate";
  icon?: "clock" | "info";
}

interface TableFooterStatsProps {
  totalCount: number;
  unitLabel: string;
  secondaryStats?: StatItem[];
}

export function TableFooterStats({
  totalCount,
  unitLabel,
  secondaryStats = [],
}: TableFooterStatsProps) {
  const getColorClass = (color?: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600";
      case "orange":
        return "text-orange-600";
      case "green":
        return "text-green-600";
      case "red":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  const getIcon = (icon?: string) => {
    switch (icon) {
      case "clock":
        return <Clock className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 px-2 py-4 gap-4 border-t border-slate-100 mt-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-medium">
          แสดงทั้งหมด <span className="text-slate-900">{totalCount}</span>{" "}
          {unitLabel}
        </span>

        {secondaryStats.map((stat, idx) => (
          <span
            key={idx}
            className={`flex items-center gap-1.5 font-medium ${getColorClass(stat.color)}`}
          >
            {getIcon(stat.icon)}
            {stat.value} {stat.label}
          </span>
        ))}
      </div>

      <div className="text-right whitespace-nowrap">
        <p className="text-xs opacity-70">
          อัพเดทล่าสุด: {new Date().toLocaleDateString("th-TH")}
        </p>
      </div>
    </div>
  );
}
