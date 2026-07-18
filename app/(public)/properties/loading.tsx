export default function PropertiesLoading() {
  return (
    <div className="min-h-screen bg-slate-50/50 pt-(--nav-offset,64px)">
      {/* Skeleton Banner */}
      <section className="relative overflow-hidden w-full border-b border-slate-100 bg-slate-100/30 py-12 md:py-20">
        <div className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 mt-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-3xl space-y-6 w-full animate-pulse">
              {/* Badge skeleton */}
              <div className="h-6 w-36 bg-slate-200 rounded-full" />
              {/* Title skeletons */}
              <div className="space-y-3">
                <div className="h-10 md:h-12 w-3/4 bg-slate-200 rounded-2xl" />
                <div className="h-10 md:h-12 w-1/2 bg-slate-200 rounded-2xl" />
              </div>
              {/* Description skeletons */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-200 rounded-md" />
                <div className="h-4 w-5/6 bg-slate-200 rounded-md" />
              </div>
              {/* Tag skeletons */}
              <div className="flex gap-3">
                <div className="h-8 w-28 bg-slate-200 rounded-xl" />
                <div className="h-8 w-28 bg-slate-200 rounded-xl" />
              </div>
            </div>
            {/* Image skeleton */}
            <div className="relative w-full lg:w-[480px] aspect-video rounded-3xl bg-slate-200 animate-pulse shrink-0" />
          </div>
        </div>
      </section>

      {/* Main content grid skeleton */}
      <div className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-12 space-y-16">
        {/* Features loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-2xs">
              <div className="w-full aspect-video rounded-2xl bg-slate-200" />
              <div className="h-5 w-2/3 bg-slate-200 rounded-md" />
              <div className="h-4 w-full bg-slate-200 rounded-md" />
            </div>
          ))}
        </div>

        {/* Listing cards skeleton */}
        <div className="space-y-6">
          <div className="h-8 w-48 bg-slate-200 rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 p-4 space-y-4 shadow-2xs">
                <div className="w-full aspect-[4/3] rounded-2xl bg-slate-200" />
                <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
                <div className="h-4 w-1/2 bg-slate-200 rounded-md" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 w-20 bg-slate-200 rounded-md" />
                  <div className="h-6 w-16 bg-slate-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
