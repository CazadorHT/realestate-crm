import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-32 w-full bg-slate-100 rounded-2xl animate-pulse" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-50 border border-slate-100 rounded-xl animate-pulse"
          />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-slate-50 border border-slate-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
