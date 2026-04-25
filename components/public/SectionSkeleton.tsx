import { Skeleton } from "@/components/ui/skeleton";

export function SectionSkeleton() {
  return (
    <section className="py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8 bg-white border-y border-slate-50">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        <div className="space-y-4 text-center flex flex-col items-center">
          <Skeleton className="h-6 md:h-8 w-32 md:w-48 rounded-full" />
          <Skeleton className="h-10 md:h-16 w-full max-w-2xl rounded-2xl" />
          <Skeleton className="h-4 md:h-6 w-3/4 max-w-xl rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <Skeleton className="h-64 md:h-80 rounded-3xl" />
          <Skeleton className="h-64 md:h-80 rounded-3xl" />
          <Skeleton className="h-64 md:h-80 rounded-3xl" />
        </div>
      </div>
    </section>
  );
}
