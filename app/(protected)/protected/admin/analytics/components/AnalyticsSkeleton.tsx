import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-5 w-96 rounded-lg opacity-60" />
        </div>
        <div className="flex items-center gap-2 w-full lg:w-auto self-end">
          <Skeleton className="h-10 w-44 rounded-xl bg-slate-100" />
          <Skeleton className="h-10 w-44 rounded-xl bg-slate-100" />
        </div>
      </div>

      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none shadow-sm h-32">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-none shadow-soft h-24">
            <CardContent className="p-5 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-soft h-[400px]">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-end gap-2 p-6">
            <Skeleton className="h-1/2 w-12" />
            <Skeleton className="h-3/4 w-12" />
            <Skeleton className="h-1/3 w-12" />
            <Skeleton className="h-full w-12" />
            <Skeleton className="h-1/2 w-12" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft h-[400px]">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center p-6">
            <Skeleton className="h-48 w-48 rounded-full border-16 border-slate-100" />
          </CardContent>
        </Card>
      </div>

      {/* Table Skeleton */}
      <Card className="border-none shadow-soft overflow-hidden">
        <CardHeader className="bg-slate-50/50 p-4">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64 opacity-60" />
        </CardHeader>
        <CardContent className="p-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b border-slate-50 flex items-center gap-4">
              <Skeleton className="h-12 w-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
