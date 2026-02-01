import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)] px-2 animate-pulse">
      {Array.from({ length: 4 }).map((_, colIndex) => (
        <div
          key={colIndex}
          className="flex flex-col bg-slate-100/50 rounded-xl w-[280px] min-w-[280px] border border-slate-200 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
          <div className="p-3 space-y-3">
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-sm"
              >
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-40" />
                <div className="pt-2 border-t flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
