// Skeleton for property detail page while loading
export default function Loading() {
  return (
    <main className="min-h-screen bg-white pb-24 lg:pb-20 font-sans">
      {/* 1 & 2. Integrated Hero Skeleton */}
      <div className="flex flex-col">
        {/* Header Skeleton: order-2 on mobile, order-1 on desktop */}
        <div className="order-2 lg:order-1">
          <div className="pt-3 lg:pt-24 px-5 md:px-6 lg:px-8 bg-white relative animate-pulse">
            <div className="max-w-screen-2xl px-4 sm:px-6 lg:px-8 mx-auto">
              <div className="flex flex-col gap-3 md:gap-4">
                {/* Breadcrumbs */}
                <div className="mb-2 h-4 w-64 bg-slate-50 rounded" />

                <div className="flex flex-col lg:items-start gap-4 lg:gap-0">
                  <div className="flex lg:flex-row flex-col gap-4 w-full justify-between items-end">
                    {/* Left Side: Info */}
                    <div className="space-y-3 grow min-w-0 max-w-[950px] w-full">
                      {/* Badges */}
                      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                        <div className="h-8 w-24 bg-slate-100 rounded-full" />
                        <div className="h-8 w-20 bg-slate-100 rounded-full" />
                        <div className="h-8 w-32 bg-slate-100 rounded-full" />
                      </div>

                      {/* Title */}
                      <div className="space-y-2">
                        <div className="h-8 w-full md:w-[600px] bg-slate-200 rounded-lg md:rounded-xl" />
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-slate-100 rounded" />
                        <div className="h-4 w-48 bg-slate-100 rounded" />
                      </div>

                      {/* Mobile Price Skeleton */}
                      <div className="block lg:hidden bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-6 w-full h-[90px]" />

                      {/* Key Selling Points (Brief) - Matches KeySellingPoints container */}
                      <div className="bg-blue-50/30 border border-blue-50 rounded-xl px-4 py-6 mt-4 max-w-[950px] w-full h-[100px]" />
                    </div>

                    {/* Right Side: Desktop Price Skeleton */}
                    <div className="hidden lg:block bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-8 lg:mt-4 lg:w-[350px] w-full h-[120px] shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Skeleton: order-1 on mobile, order-2 on desktop */}
        <div className="order-1 lg:order-2 pt-16 lg:pt-0">
          <div className="max-w-screen-2xl px-4 sm:px-6 lg:px-8 mx-auto mt-0 lg:mt-8">
            <section className="mb-2 lg:mb-10 animate-pulse">
              {/* Mobile/Tablet Gallery (-mx-4 replaced with -mx-9 to match PropertyGallery) */}
              <div className="lg:hidden relative h-[320px] md:h-[450px] -mx-4 xs:-mx-6 sm:mx-0 rounded-none sm:rounded-xl bg-slate-50 overflow-hidden">
                <div className="absolute inset-0 bg-slate-100" />
              </div>

              {/* Desktop Gallery Grid */}
              <div className="hidden lg:grid grid-cols-4 gap-1.5 md:gap-2 h-[450px] xl:h-[550px] rounded-2xl lg:rounded-3xl bg-slate-50 overflow-hidden">
                <div className="col-span-2 row-span-2 bg-slate-100" />
                <div className="grid grid-cols-2 gap-2 col-span-2 row-span-2">
                  <div className="bg-slate-100" />
                  <div className="bg-slate-100" />
                  <div className="bg-slate-100" />
                  <div className="bg-slate-100" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl px-4 sm:px-6 lg:px-8 mx-auto mt-4 lg:mt-8">
        {/* 3. Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr] gap-6 md:gap-10 lg:gap-16 mb-6 md:mb-10">
            {/* Left Content */}
            <div className="space-y-6 md:space-y-10">
              {/* Specs Grid */}
              <section className="animate-pulse">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-slate-50/30 rounded-xl md:rounded-2xl p-4 md:p-5 space-y-2 border border-slate-100/50"
                    >
                      <div className="h-8 w-8 bg-slate-100 rounded-lg md:rounded-xl" />
                      <div className="h-6 w-16 bg-slate-100 rounded" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Badges Section (Ticker style) */}
              <section className="animate-pulse border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-9 w-24 bg-emerald-100/50 rounded-full shrink-0" />
                  <div className="h-9 w-32 bg-slate-100 rounded-full shrink-0" />
                  <div className="h-9 w-28 bg-slate-50 rounded-full shrink-0" />
                  <div className="h-9 w-36 bg-slate-50 rounded-full shrink-0" />
                  <div className="h-9 w-24 bg-slate-50 rounded-full shrink-0" />
                </div>
              </section>

              {/* Description */}
              <section className="space-y-4 animate-pulse">
                <div className="h-12 w-48 bg-blue-50 border-l-4 border-blue-600 rounded-r-xl" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-slate-50 rounded" />
                  <div className="h-4 w-full bg-slate-50 rounded" />
                  <div className="h-4 w-[90%] bg-slate-50 rounded" />
                </div>
              </section>

              {/* Nearby Places [NEW] */}
              <section className="space-y-6 animate-pulse mt-10">
                <div className="h-12 w-56 bg-blue-50 border-l-4 border-blue-600 rounded-r-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 h-[120px]" />
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 h-[120px]" />
                </div>
              </section>

              <hr className="border-slate-50" />

              {/* Amenities */}
              <section className="space-y-4 animate-pulse">
                <div className="h-12 w-48 bg-blue-50 border-l-4 border-blue-200 rounded-r-xl" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-50 rounded-full" />
                      <div className="h-4 w-24 bg-slate-50 rounded" />
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-slate-50" />

              {/* Map */}
              <section className="space-y-4 animate-pulse">
                <div className="h-12 w-48 bg-blue-50 border-l-4 border-blue-200 rounded-r-xl" />
                <div className="h-[300px] md:h-[450px] bg-slate-50 rounded-2xl border border-slate-100" />
              </section>
            </div>

            {/* Right Sidebar */}
            <aside className="relative space-y-6 flex flex-col md:flex-row xl:flex-col gap-6 w-full">
              <div className="animate-pulse space-y-6 w-full flex-1">
                {/* Suitability */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 h-[200px]" />
              </div>

              <div className="animate-pulse w-full flex-1">
                {/* Agent Sidebar */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 md:h-20 md:w-20 lg:h-16 lg:w-16 bg-slate-100 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-16 bg-slate-50 rounded" />
                      <div className="h-5 w-32 bg-slate-100 rounded" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="h-12 w-full bg-[#06C755]/10 rounded-xl" />
                    <div className="h-12 w-full bg-slate-50 rounded-xl" />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="h-12 w-full bg-blue-50 rounded-xl" />
                      <div className="h-12 w-full bg-slate-50 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Similar Properties Section */}
          <section className="mt-12 md:mt-20 pb-20 animate-pulse">
            <div className="h-8 w-64 bg-slate-100 rounded-lg mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-4 bg-white rounded-2xl sm:rounded-2xl md:rounded-3xl overflow-hidden border border-slate-50 shadow-sm p-0"
                >
                  <div className="aspect-4/3 bg-slate-100" />
                  <div className="space-y-3 p-4 sm:p-5 md:p-6">
                    <div className="h-5 w-full bg-slate-100 rounded-lg" />
                    <div className="h-4 w-2/3 bg-slate-50 rounded-lg" />
                    <div className="flex gap-2">
                      <div className="h-8 w-16 bg-slate-50 rounded-full" />
                      <div className="h-8 w-16 bg-slate-50 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
    </main>
  );
}
