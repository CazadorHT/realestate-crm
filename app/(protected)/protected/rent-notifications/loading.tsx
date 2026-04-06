import { Skeleton } from "@/components/ui/skeleton";

export default function RentNotificationsLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* 1. Page Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-xl bg-slate-100" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 bg-slate-100" />
              <Skeleton className="h-4 w-64 bg-slate-100" />
            </div>
          </div>
          <Skeleton className="h-11 w-36 rounded-xl bg-slate-100 hidden md:block" />
        </div>
      </div>

      {/* 2. Table Context Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3"><Skeleton className="h-4 w-full" /></th>
                <th className="px-4 py-3"><Skeleton className="h-4 w-full" /></th>
                <th className="px-4 py-3"><Skeleton className="h-4 w-full" /></th>
                <th className="px-4 py-3"><Skeleton className="h-4 w-full" /></th>
                <th className="px-4 py-3"><Skeleton className="h-4 w-full" /></th>
                <th className="px-4 py-3"><Skeleton className="h-4 w-full" /></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="p-4"><Skeleton className="h-12 w-full rounded-lg" /></td>
                  <td className="p-4"><Skeleton className="h-12 w-full rounded-lg" /></td>
                  <td className="p-4"><Skeleton className="h-10 w-full rounded-lg" /></td>
                  <td className="p-4"><Skeleton className="h-8 w-16 rounded-full" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-24" /></td>
                  <td className="p-4 text-right"><Skeleton className="h-8 w-8 rounded-md inline-block" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
