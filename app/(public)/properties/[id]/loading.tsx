// skeleton ของ detail property ขณะโหลดข้อมูล
export default function Loading() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-5 w-40 bg-slate-200 rounded mb-6" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-[4/3] rounded-3xl bg-slate-200" />
        <div className="space-y-4">
          <div className="h-9 w-3/4 bg-slate-200 rounded" />
          <div className="h-5 w-1/2 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-200 rounded-2xl" />
          <div className="h-28 bg-slate-200 rounded-2xl" />
          <div className="h-11 w-52 bg-slate-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
