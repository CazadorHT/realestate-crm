export function PropertyCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white overflow-hidden shadow-sm h-full flex flex-col border border-slate-100/50">
      {/* Image Section Skeleton property.image_url */}
      <div className="relative h-48 animate-shimmer" />

      {/* Content Section Skeleton */}
      <div className="pt-2 pb-6 px-6 space-y-2 flex-grow min-h-[160px]">
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-3">
            {/* Badge & Location Skeleton */}
            <div className="h-6 w-16 animate-shimmer rounded-full" />
            <div className="h-4 w-24 animate-shimmer rounded" />
          </div>

          {/* Title Skeleton */}
          <div className="space-y-2 mb-3">
            <div className="h-6 w-full animate-shimmer rounded-md" />
            <div className="h-6 w-2/3 animate-shimmer rounded-md" />
          </div>
        </div>

        {/* Specs Skeleton */}
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 animate-shimmer rounded" />
            <div className="h-4 w-6 animate-shimmer rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 animate-shimmer rounded" />
            <div className="h-4 w-6 animate-shimmer rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 animate-shimmer rounded" />
            <div className="h-4 w-6 animate-shimmer rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 animate-shimmer rounded" />
            <div className="h-4 w-12 animate-shimmer rounded" />
          </div>
        </div>
      </div>

      {/* Footer Section Skeleton */}
      <div className="p-6 border-t border-slate-100 bg-white/60">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-3 w-12 animate-shimmer rounded" />
            <div className="h-8 w-32 animate-shimmer rounded" />
          </div>
          <div className="h-4 w-24 animate-shimmer rounded" />
        </div>
      </div>
    </div>
  );
}
