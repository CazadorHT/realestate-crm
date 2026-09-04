export function PropertyCardSkeleton() {
  return (
    <div className="group relative isolate rounded-2xl sm:rounded-2xl md:rounded-3xl bg-white overflow-hidden shadow-md h-full flex flex-col border border-slate-100/50 w-full max-w-[360px] md:max-w-none mx-auto transition-all duration-300">
      {/* Hot Deal Badge Placeholder */}
      <div className="absolute -top-5 -left-3 md:-top-7 md:-left-5 z-40">
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-slate-100 animate-pulse border border-white/50 shadow-sm" />
      </div>

      {/* Image Section Skeleton - Sync aspect with PropertyCardImage */}
      <div className="relative aspect-square sm:aspect-4/3 md:aspect-square h-auto w-full animate-pulse bg-slate-200">
        {/* Favorite Button Placeholder */}
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/60 shadow-xs" />
        
        {/* Area/Province Badge Placeholder */}
        <div className="absolute bottom-3 left-3 h-6 w-32 rounded-full bg-white/60 shadow-xs" />
      </div>

      {/* Content Section Skeleton */}
      <div className="pt-2 pb-4 sm:pb-5 md:pb-6 px-4 mt-2 sm:mt-2 md:mt-3 grow min-h-[140px] sm:min-h-[160px] md:min-h-[180px] flex flex-col gap-y-2 sm:gap-y-2 md:gap-y-3">
        {/* Type & Location Row */}
        <div className="flex justify-between items-center gap-4 mb-1">
          {/* Badge Type */}
          <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
          {/* Location */}
          <div className="h-4 w-28 bg-slate-100 rounded-md animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 w-full bg-slate-200 rounded-md animate-pulse" />
          <div className="h-5 w-3/4 bg-slate-200 rounded-md animate-pulse" />
        </div>

        {/* Specs Skeleton (Beds, Baths, Size, Parking) */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-8 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Features Icons Row */}
        <div className="flex gap-2 pt-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 w-6 rounded-md bg-slate-50 animate-pulse" />
          ))}
        </div>

        {/* Compare Button Placeholder */}
        <div className="flex items-center gap-1.5 mt-auto pt-2">
          <div className="h-4 w-4 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-16 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>

      {/* Footer Section Skeleton */}
      <div className="h-auto md:h-28 px-3 sm:px-3.5 md:px-4 py-2 sm:py-2.5 md:py-3 border-t border-slate-200 bg-white/60 shrink-0 flex flex-col justify-between gap-2">
        {/* Price/Type Section */}
        <div className="flex justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-7 w-28 bg-slate-200 rounded-md animate-pulse" />
          </div>
          <div className="space-y-2 flex-1 items-end flex flex-col">
            <div className="h-3 w-10 bg-slate-100 rounded animate-pulse" />
            <div className="h-7 w-28 bg-slate-200 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Footer Bottom Row */}
        <div className="flex justify-between items-center ">
          <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
