"use client";

interface CompareLoadingSkeletonProps {
  count?: number;
}

export function CompareLoadingSkeleton({
  count = 3,
}: CompareLoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[300px] md:h-[400px] bg-white rounded-2xl md:rounded-3xl border border-slate-200"
        />
      ))}
    </div>
  );
}
