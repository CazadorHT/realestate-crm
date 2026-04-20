import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";

export function RecentlyViewedSkeleton() {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4 flex-1">
             <Skeleton className="h-8 w-40 rounded-full" />
             <Skeleton className="h-12 w-3/4 max-w-xl" />
          </div>
          <Skeleton className="h-12 w-32 rounded-full hidden md:block" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
