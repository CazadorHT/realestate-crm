// Skeleton for property detail page while loading
export default function Loading() {
  return (
    <main className="min-h-screen bg-white pb-20 font-sans">
      {/* Header & Breadcrumb Skeleton */}
      <div className="pt-24 bg-white sticky top-0 z-30 opacity-95 backdrop-blur-sm shadow-sm md:shadow-none md:static">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 animate-pulse">
            {/* Back Link */}
            <div className="flex justify-between items-center">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="md:hidden flex items-center gap-2">
                <div className="h-9 w-9 bg-slate-200 rounded-full" />
                <div className="h-9 w-28 bg-slate-200 rounded-full" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-3 grow min-w-0 max-w-[800px]">
                {/* Badge and ID */}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-16 bg-slate-200 rounded-full" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <div className="h-8 w-full bg-slate-200 rounded" />
                  <div className="h-8 w-3/4 bg-slate-200 rounded" />
                </div>

                {/* Location */}
                <div className="h-5 w-2/3 bg-slate-200 rounded" />
              </div>

              {/* Price Section */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 md:p-6">
                <div className="flex flex-col md:items-end gap-2">
                  <div className="h-8 w-48 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-8">
        {/* Gallery Skeleton */}
        <section className="mb-10 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[450px] rounded-3xl overflow-hidden">
            {/* Main Image */}
            <div className="md:col-span-2 md:row-span-2 bg-slate-200" />

            {/* Sub Images */}
            <div className="hidden md:grid grid-cols-2 gap-2 col-span-2 row-span-2">
              <div className="bg-slate-200" />
              <div className="bg-slate-200" />
              <div className="bg-slate-200" />
              <div className="bg-slate-200" />
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr] gap-10 lg:gap-16 mb-10">
          {/* Left Content */}
          <div className="space-y-10">
            {/* Specs Grid Skeleton */}
            <section className="animate-pulse">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100"
                  >
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                    <div className="h-6 w-12 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </section>

            {/* Title Section Skeleton */}
            <section className="space-y-4 animate-pulse">
              <div className="h-8 w-full bg-slate-200 rounded" />
              <div className="h-5 w-2/3 bg-slate-200 rounded" />
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="h-8 w-16 bg-slate-200 rounded-full" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
              </div>
            </section>

            {/* Description Skeleton */}
            <section className="space-y-4 animate-pulse">
              <div className="h-7 w-48 bg-slate-200 rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-5/6 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-4/5 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Features Skeleton */}
            <section className="space-y-4 animate-pulse">
              <div className="h-7 w-56 bg-slate-200 rounded" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-slate-200 rounded-full" />
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Map Skeleton */}
            <section className="space-y-4 animate-pulse">
              <div className="h-7 w-48 bg-slate-200 rounded" />
              <div className="h-64 bg-slate-200 rounded-3xl" />
            </section>
          </div>

          {/* Right Sidebar Skeleton */}
          <aside className="relative">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sticky top-24 animate-pulse">
              {/* Agent Info */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="h-16 w-16 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3 mb-6">
                <div className="h-12 w-full bg-slate-200 rounded-xl" />
                <div className="h-12 w-full bg-slate-200 rounded-xl" />
                <div className="h-12 w-full bg-slate-200 rounded-xl" />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pb-6 border-b border-slate-100">
                <div className="h-10 flex-1 bg-slate-200 rounded-full" />
                <div className="h-10 w-32 bg-slate-200 rounded-full" />
              </div>

              {/* Trust Message */}
              <div className="mt-6 text-center space-y-2">
                <div className="h-3 w-4/5 bg-slate-200 rounded mx-auto" />
                <div className="h-3 w-3/4 bg-slate-200 rounded mx-auto" />
              </div>
            </div>
          </aside>
        </div>

        {/* Similar Properties Skeleton */}
        <section className="mt-16 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden"
              >
                <div className="aspect-square bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-full bg-slate-200 rounded" />
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-6 w-1/2 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
