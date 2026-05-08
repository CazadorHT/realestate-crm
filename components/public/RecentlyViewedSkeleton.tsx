import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SectionBackground } from "./SectionBackground";

interface RecentlyViewedSkeletonProps {
  containerClassName?: string;
}

export function RecentlyViewedSkeleton({ containerClassName }: RecentlyViewedSkeletonProps) {
  return (
    <section className="min-h-[450px] md:min-h-[500px] py-10 md:py-12 px-4 md:px-6 lg:px-8 bg-slate-50 border-t border-slate-100 overflow-hidden relative z-0">
      <SectionBackground pattern="blobs" intensity="low" />
      <div className={cn("max-w-7xl mx-auto px-4 md:px-6 lg:px-8", containerClassName)}>
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 md:h-8 w-48 md:w-80" />
              <Skeleton className="h-3 md:h-4 w-40 md:w-64" />
            </div>
          </div>
        </div>

        {/* Navigation Buttons Skeleton */}
        <div className="flex justify-end gap-2 mb-3 md:mb-4">
          <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
          <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
        </div>

        {/* Cards Skeleton */}
        <div className="flex gap-4 md:gap-6 overflow-hidden pb-4 md:pb-6 px-1 md:px-2 pt-6 md:pt-9">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[260px] w-[260px] md:min-w-[300px] md:w-[300px] bg-white rounded-[1.5rem] md:rounded-4xl border border-slate-100 overflow-hidden"
            >
              <Skeleton className="h-36 md:h-44 w-full rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between mt-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
