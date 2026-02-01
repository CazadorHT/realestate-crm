import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PlusCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Placeholder */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-200 p-6 md:p-8 shadow-sm h-[180px] animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-300 rounded-xl" />
              <div className="h-8 w-48 bg-slate-300 rounded" />
            </div>
            <div className="h-4 w-64 bg-slate-300 rounded" />
          </div>
          <div className="h-10 w-32 bg-slate-300 rounded" />
        </div>
      </div>

      <DashboardSkeleton />

      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-12 w-full bg-slate-100 rounded animate-pulse" />
        <TableSkeleton columnCount={8} rowCount={10} />
      </div>
    </div>
  );
}
