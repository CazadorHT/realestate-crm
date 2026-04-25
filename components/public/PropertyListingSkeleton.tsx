import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";

export function PropertyListingSkeleton() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white border-y border-slate-100">
      <div className="max-w-screen-2xl px-6 lg:px-8 mx-auto">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8 md:mb-10">
          <div className="space-y-3 flex-1">
            {/* Title */}
            <Skeleton className="h-10 md:h-14 w-64 md:w-96 rounded-xl" />
            {/* Description */}
            <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
            {/* Info Badges */}
            <div className="flex gap-3 pt-1">
              <Skeleton className="h-7 w-32 rounded-full" />
              <Skeleton className="h-7 w-40 rounded-full" />
            </div>
          </div>
          
          <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-4">
             {/* Action Row */}
             <div className="flex gap-4 w-full justify-start lg:justify-end">
               <Skeleton className="h-11 w-32 rounded-2xl hidden lg:block" />
               <Skeleton className="h-8 w-48 rounded-full" />
             </div>
             {/* Filter Row */}
             <div className="flex gap-2 overflow-hidden w-full max-w-full lg:max-w-[450px]">
               {[1, 2, 3, 4, 5, 6].map(i => (
                 <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
               ))}
             </div>
          </div>
        </div>

        {/* Grid Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>

        {/* More Button */}
        <div className="flex justify-center mt-12">
          <Skeleton className="h-11 w-48 rounded-xl" />
        </div>
      </div>
    </section>
  );
}
