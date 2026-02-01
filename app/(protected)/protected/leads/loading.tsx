import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      {/* Simple Header Skeleton */}
      <div className="h-32 w-full bg-slate-100 rounded-2xl animate-pulse" />

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-50 border border-slate-100 rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* View Switcher Skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-48 bg-slate-100 rounded-xl animate-pulse" />
      </div>

      {/* Main Content Skeleton - Cards/Kanban Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-10">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="space-y-4">
            <div className="h-10 w-full bg-slate-100/50 rounded-lg animate-pulse" />
            {Array.from({ length: 3 }).map((_, card) => (
              <div key={card} className="h-40 bg-white border border-slate-100 rounded-xl p-4 space-y-3 animate-pulse shadow-sm">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                  <div className="h-4 w-12 bg-slate-100 rounded" />
                </div>
                <div className="h-3 w-24 bg-slate-50 rounded" />
                <div className="h-3 w-40 bg-slate-50 rounded" />
                <div className="pt-2 border-t border-slate-100 flex justify-between">
                  <div className="h-3 w-16 bg-slate-50 rounded" />
                  <div className="h-3 w-12 bg-slate-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
