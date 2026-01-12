export function PropertyCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white overflow-hidden shadow-sm h-full flex flex-col border border-slate-100/50 w-[350px]">
      {/* Image Section Skeleton - Matches h-[300px] */}
      <div className="relative h-[300px] w-full animate-pulse bg-slate-200" />

      {/* Content Section Skeleton */}
      <div className="pt-4 pb-6 px-6 space-y-4 flex-grow min-h-[250px]">
        {/* Badge & Price Row */}
        <div className="flex justify-between items-start">
          {/* Badge Type */}
          <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
          {/* Price */}
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Title & Location */}
        <div className="space-y-2">
          <div className="h-6 w-full bg-slate-200 rounded-md animate-pulse" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-4 w-4 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-4 w-40 bg-slate-200 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Specs Divider */}
        <div className="border-t border-slate-100 my-4" />

        {/* Specs Skeleton (Beds, Baths, Size, Parking) */}
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-8 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Section Skeleton */}
      <div className="h-28 px-4 py-3 border-t border-slate-100 bg-slate-50 flex-shrink-0 flex flex-col justify-between">
        {/* Price/Type Section */}
        <div className="space-y-2">
          <div className="h-3 w-10 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-36 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Button Section */}
        <div className="flex justify-between items-center mt-2 ">
          <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
