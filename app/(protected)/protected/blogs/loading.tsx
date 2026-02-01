import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-32 w-full bg-slate-100 rounded-2xl" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-50 border border-slate-100 rounded-xl"
          />
        ))}
      </div>

      <div className="space-y-4">
        <TableSkeleton columnCount={5} rowCount={10} />
      </div>
    </div>
  );
}
