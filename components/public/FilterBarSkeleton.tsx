export function FilterBarSkeleton() {
  return (
    <div className="bg-white border-b border-slate-100 sticky top-16 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="max-w-screen-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Row 1: Search + Core Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-4">
          {/* Search Bar - 5 columns */}
          <div className="lg:col-span-5">
            <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
          </div>

          {/* Property Type - 2 columns */}
          <div className="lg:col-span-2">
            <div className="h-12 w-[160px] bg-slate-200 rounded-xl animate-pulse" />
          </div>

          {/* Listing Type Buttons - 3 columns */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-4 gap-1.5 h-12">
              <div className="bg-slate-200 rounded-lg animate-pulse" />
              <div className="bg-slate-200 rounded-lg animate-pulse" />
              <div className="bg-slate-200 rounded-lg animate-pulse" />
              <div className="bg-slate-200 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Price Range - 2 columns */}
          <div className="lg:col-span-2">
            <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Row 2: Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Area */}
          <div className="h-12 w-[160px] bg-slate-200 rounded-xl animate-pulse" />

          {/* Bedrooms */}
          <div className="h-12 w-[240px] bg-slate-200 rounded-xl animate-pulse" />

          {/* Near Train */}
          <div className="h-12 w-[140px] bg-slate-200 rounded-xl animate-pulse" />

          {/* Pet Friendly */}
          <div className="h-12 w-[140px] bg-slate-200 rounded-xl animate-pulse" />

          {/* Sort */}
          <div className="h-12 w-[210px] bg-slate-200 rounded-xl animate-pulse" />

          {/* Clear Button */}
          <div className="ml-auto h-12 w-[140px] bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
