export function PropertyCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white overflow-hidden shadow-sm h-full flex flex-col border border-slate-100">
      {/* Image Section Skeleton */}
      <div className="relative h-52 animate-shimmer" />

      {/* Content Section Skeleton */}
      <div className="p-6 space-y-4 flex-grow">
        <div className="flex justify-between items-center mb-3">
          {/* Badge & Location Skeleton */}
          <div className="h-6 w-16 animate-shimmer rounded-full" />
          <div className="h-4 w-24 animate-shimmer rounded" />
        </div>
        
        {/* Title Skeleton */}
        <div className="space-y-2">
          <div className="h-6 w-full animate-shimmer rounded-md" />
          <div className="h-6 w-2/3 animate-shimmer rounded-md" />
        </div>

        {/* Description Skeleton (Match min-h-[65px]) */}
        <div className="space-y-2 min-h-[65px] pt-2">
          <div className="h-3 w-full animate-shimmer rounded" />
          <div className="h-3 w-full animate-shimmer rounded" />
          <div className="h-3 w-4/5 animate-shimmer rounded" />
        </div>

        {/* Specs Skeleton */}
        <div className="flex gap-4 pt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-5 w-10 animate-shimmer rounded" />
          ))}
        </div>
      </div>

      {/* Footer Section Skeleton */}
      <div className="px-6 pb-6 pt-4 border-t border-slate-50 bg-white/60">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-3 w-12 animate-shimmer rounded" />
            <div className="h-8 w-32 animate-shimmer rounded" />
          </div>
          <div className="h-4 w-20 animate-shimmer rounded" />
        </div>
      </div>
    </div>
  );
}