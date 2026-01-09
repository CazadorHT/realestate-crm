import { Skeleton } from "@/components/ui/skeleton";
import { PropertyCardSkeleton } from "@/components/public/PropertyCardSkeleton";

export function HotDealsSkeleton() {
  return (
    <section className="py-28 relative overflow-hidden">
      {/* Background placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-rose-50 -z-20" />

      <div className="max-w-screen-2xl mx-auto px-4 relative z-10">
        {/* === HEADER SECTION === */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-5 max-w-2xl w-full">
            {/* Badge Skeleton */}
            <Skeleton className="h-8 w-40 rounded-full bg-slate-200" />

            {/* Title Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-12 md:h-14 w-3/4 bg-slate-900/10" />
              <Skeleton className="h-12 md:h-14 w-1/2 bg-slate-900/10" />
            </div>

            {/* Description Skeleton */}
            <div className="flex items-start gap-3 w-full">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>

          <div className="flex gap-3">
            <Skeleton className="h-12 w-40 rounded-full bg-slate-900/10" />
          </div>
        </div>

        {/* === CARDS SECTION === */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 ">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[2.5rem] p-1.5 border border-white/50 "
            >
              <div className="rounded-[2rem] overflow-hidden bg-white ">
                <PropertyCardSkeleton />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
