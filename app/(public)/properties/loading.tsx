import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 pt-(--nav-offset,0px) transition-[padding-top] duration-300 ease-in-out">
      {/* Breadcrumbs Skeleton */}
      <div className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 animate-pulse">
          <div className="h-4 w-12 bg-slate-200 rounded-md" />
          <div className="h-3 w-3 bg-slate-200 rounded-full" />
          <div className="h-4 w-24 bg-slate-200 rounded-md" />
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-5 md:px-6 lg:px-8 pb-12">
        {/* Search & Filter Controls Skeleton */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl border border-slate-100 p-4 md:p-6 shadow-sm mb-8 space-y-4 animate-pulse">
          {/* Top Search Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="h-10 grow bg-slate-100 border border-slate-200/50 rounded-xl" />
            <div className="h-10 w-full md:w-48 bg-slate-100 border border-slate-200/50 rounded-xl" />
            <div className="h-10 w-full md:w-48 bg-slate-100 border border-slate-200/50 rounded-xl" />
          </div>

          {/* Bottom Filter Toggles */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 sm:w-28 bg-slate-100 border border-slate-200/50 rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* Results Info Skeleton */}
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className="h-5 w-40 bg-slate-200 rounded-md" />
          <div className="h-8 w-28 bg-slate-100 border border-slate-200/50 rounded-lg" />
        </div>

        {/* Property Grid Skeleton */}
        <div className="grid gap-6 md:gap-y-8 lg:gap-x-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl md:rounded-3xl w-full bg-white shadow-md border border-slate-100 h-full flex flex-col overflow-hidden animate-pulse"
            >
              {/* Image Skeleton */}
              <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-slate-200"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l3.5 6a1 1 0 0 1-.127 1.011Z" />
                </svg>
              </div>

              {/* Card Details Skeleton */}
              <div className="p-4 sm:p-5 flex flex-col grow gap-y-3">
                {/* Price and Badge Row */}
                <div className="flex items-center justify-between">
                  <div className="h-6 w-24 bg-slate-200 rounded-md" />
                  <div className="h-5 w-16 bg-slate-200 rounded-full" />
                </div>

                {/* Title Skeleton */}
                <div className="space-y-2 mt-1">
                  <div className="h-4 w-full bg-slate-200 rounded-md" />
                  <div className="h-4 w-4/5 bg-slate-200 rounded-md" />
                </div>

                {/* Location / Area Skeleton */}
                <div className="h-3 w-1/2 bg-slate-200 rounded-md mt-1" />

                {/* Specs Row Skeleton */}
                <div className="flex items-center gap-4 py-2 border-y border-slate-50 mt-2">
                  <div className="flex items-center gap-1.5 grow">
                    <div className="h-4 w-4 bg-slate-100 rounded-full" />
                    <div className="h-3 w-8 bg-slate-200 rounded-md" />
                  </div>
                  <div className="flex items-center gap-1.5 grow">
                    <div className="h-4 w-4 bg-slate-100 rounded-full" />
                    <div className="h-3 w-8 bg-slate-200 rounded-md" />
                  </div>
                  <div className="flex items-center gap-1.5 grow">
                    <div className="h-4 w-4 bg-slate-100 rounded-full" />
                    <div className="h-3.5 w-12 bg-slate-200 rounded-md" />
                  </div>
                </div>

                {/* Features Badges Skeleton */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <div className="h-5 w-16 bg-slate-100 rounded-md" />
                  <div className="h-5 w-20 bg-slate-100 rounded-md" />
                </div>
              </div>

              {/* Card Footer Skeleton */}
              <div className="px-4 pb-4 mt-auto">
                <div className="h-9 w-full bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
