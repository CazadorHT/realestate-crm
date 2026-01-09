import { Skeleton } from "@/components/ui/skeleton";

export function MortgageCalculatorSkeleton() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Introduction Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-8 w-48 rounded-full bg-slate-100" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-3/4 bg-slate-100" />
              <Skeleton className="h-10 w-1/2 bg-slate-100" />
            </div>
            <Skeleton className="h-20 w-full bg-slate-100" />

            {/* Summary Box Skeleton */}
            <Skeleton className="h-64 w-full rounded-2xl bg-slate-900/10 mt-8" />
          </div>

          {/* Right: Calculator Controls Skeleton */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 space-y-8 shadow-sm">
            {/* Property Price */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-10 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-full rounded-full" />
            </div>

            {/* Down Payment */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Interest Rate */}
              <div className="space-y-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>

              {/* Loan Term */}
              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>

            <Skeleton className="w-full h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
