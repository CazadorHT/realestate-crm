"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function MapSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
      <div className="relative w-full h-[300px] md:h-[450px] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200">
        <Skeleton className="absolute inset-0 h-full w-full" />
        {/* Simulated Map Markers */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <Skeleton className="h-10 w-10 rounded-full border-4 border-white shadow-xl" />
            <Skeleton className="absolute -bottom-8 -left-4 h-4 w-20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SimilarPropertiesSkeleton() {
  return (
    <div className="mt-16 space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-4/3 w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailedSpecsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-6 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}