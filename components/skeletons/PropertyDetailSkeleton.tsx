import { Skeleton } from "@/components/ui/skeleton";

export function PropertyCRMDetailsSkeleton() {
  return (
    <div className="space-y-4 p-6 bg-slate-50 rounded-2xl animate-pulse">
      <Skeleton className="h-6 w-32 bg-slate-200" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full bg-slate-200" />
        <Skeleton className="h-4 w-3/4 bg-slate-200" />
      </div>
    </div>
  );
}

export function PropertyAmenitiesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg bg-slate-200" />
          <Skeleton className="h-4 w-20 bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function PropertyMapSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-6 w-40 bg-slate-200" />
      <Skeleton className="w-full aspect-video rounded-2xl bg-slate-200" />
    </div>
  );
}
