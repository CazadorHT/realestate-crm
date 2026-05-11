import { Skeleton } from "@/components/ui/skeleton";

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative isolate">
      {/* Shimmer overlay for the whole card */}
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer z-10" />
      
      {/* Image Skeleton */}
      <div className="relative aspect-4/3 w-full bg-slate-200 animate-shimmer" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Status & Type Badges */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full animate-shimmer" />
          <Skeleton className="h-5 w-20 rounded-full animate-shimmer" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-full animate-shimmer" />
          <Skeleton className="h-6 w-3/4 animate-shimmer" />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full animate-shimmer" />
          <Skeleton className="h-4 w-1/2 animate-shimmer" />
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Skeleton className="h-10 w-full rounded-xl animate-shimmer" />
          <Skeleton className="h-10 w-full rounded-xl animate-shimmer" />
          <Skeleton className="h-10 w-full rounded-xl animate-shimmer" />
        </div>

        {/* Footer (Price) */}
        <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
          <div className="space-y-1">
            <Skeleton className="h-4 w-12 animate-shimmer" />
            <Skeleton className="h-7 w-24 animate-shimmer" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:gap-y-8 lg:gap-x-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
