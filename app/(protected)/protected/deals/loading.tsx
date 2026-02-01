import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="h-32 w-full bg-slate-100 rounded-2xl animate-pulse" />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-50 border border-slate-100 rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* Win Rate Card */}
      <div className="h-24 w-full bg-blue-50/50 border border-blue-100 rounded-xl animate-pulse" />

      {/* Table Section */}
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <TableSkeleton columnCount={10} rowCount={10} />
      </div>
    </div>
  );
}
