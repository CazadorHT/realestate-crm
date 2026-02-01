import { TableSkeleton } from "@/components/ui/TableSkeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-32 w-full bg-slate-100 rounded-2xl animate-pulse" />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-slate-50 border border-slate-100 rounded-xl animate-pulse"
          />
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
        <TableSkeleton columnCount={7} rowCount={10} />
      </div>
    </div>
  );
}
