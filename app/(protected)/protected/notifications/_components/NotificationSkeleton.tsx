"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function NotificationSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-5 sm:p-6 flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32 rounded-lg" />
              <Skeleton className="h-2 w-2 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-3 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
