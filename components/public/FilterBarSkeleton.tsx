export function FilterBarSkeleton() {
  return (
    <div className="bg-white border-b border-slate-100 sticky top-(--nav-offset,64px) z-30 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="max-w-screen-2xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        
        {/* Mobile Skeleton (xl:hidden) */}
        <div className="xl:hidden flex gap-3 my-4">
          <div className="flex-1 h-12 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse shrink-0" />
          <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse shrink-0" />
        </div>

        {/* Desktop Skeleton (hidden xl:block) */}
        <div className="hidden xl:block">
          {/* Row 1: Core Search */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            <div className="col-span-3">
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            </div>
            <div className="col-span-2">
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            </div>
            <div className="col-span-2">
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            </div>
            <div className="col-span-3">
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            </div>
            <div className="col-span-2">
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Row 2: Secondary Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-[180px] bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 w-[170px] bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 w-[240px] bg-slate-100 rounded-xl animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-12 w-12 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-12 w-12 bg-slate-100 rounded-full animate-pulse" />
              <div className="h-12 w-12 bg-slate-100 rounded-full animate-pulse" />
            </div>
            <div className="ml-auto h-12 w-[160px] bg-slate-50 border border-slate-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
