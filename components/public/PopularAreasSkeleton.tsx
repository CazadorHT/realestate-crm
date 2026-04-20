import { Skeleton } from "@/components/ui/skeleton";

export function PopularAreasSkeleton() {
  return (
    <section className="pt-8 bg-white">
      <div className="max-w-screen-2xl mx-auto sm:px-4 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between px-4 ">
          <div className="space-y-4 px-4 md:px-0 flex-1">
            {/* Badge Skeleton */}
            <Skeleton className="h-9 w-40 rounded-full bg-blue-500/10" />
            
            {/* Title Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-12 md:h-16 w-3/4 max-w-xl" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 px-4! md:px-0 mt-8">
          <div className="flex flex-col px-4 md:px-0 space-y-3 flex-1">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="w-full md:w-auto px-4 md:px-0">
            <Skeleton className="h-12 w-full md:w-40 rounded-2xl" />
          </div>
        </div>

        {/* Content Area - Scroll List */}
        <div className="flex gap-4 overflow-hidden py-4 px-4 md:px-0 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[160px] sm:h-[180px] w-[220px] sm:w-[260px] shrink-0 rounded-xl sm:rounded-4xl overflow-hidden"
            >
              <Skeleton className="h-full w-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
