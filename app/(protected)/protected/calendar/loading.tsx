import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";

export default function CalendarLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <CalendarDays className="h-6 w-6 text-indigo-200" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 bg-slate-100" />
            <Skeleton className="h-4 w-60 bg-slate-50" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 rounded-xl bg-slate-100" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-[700px] overflow-hidden flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-slate-50" />
            <Skeleton className="h-10 w-10 bg-slate-50" />
            <Skeleton className="h-10 w-10 bg-slate-50" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-60 bg-slate-50" />
            <Skeleton className="h-10 w-24 bg-slate-50" />
          </div>
        </div>
        <div className="flex-1 grid grid-cols-7 gap-px bg-slate-50 rounded-xl overflow-hidden mt-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="bg-white p-2 flex flex-col gap-2">
              <Skeleton className="h-4 w-4 rounded bg-slate-50" />
              {i % 4 === 0 && <Skeleton className="h-6 w-full rounded bg-indigo-50/50" />}
              {i % 7 === 0 && <Skeleton className="h-6 w-full rounded bg-emerald-50/50" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
