import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-[120px] w-full bg-slate-100 rounded-2xl" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-50 border border-slate-100 rounded-xl"
          />
        ))}
      </div>

      <TableSkeleton columnCount={4} rowCount={10} />
    </div>
  );
}
