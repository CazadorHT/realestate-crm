"use client";

import { Button } from "@/components/ui/button";

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

export function SearchPagination({
  currentPage,
  totalPages,
  setCurrentPage,
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="h-10 px-4"
        >
          ก่อนหน้า
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              // Show first, last, current, and adjacent pages
              if (page === 1 || page === totalPages) return true;
              if (page >= currentPage - 1 && page <= currentPage + 1)
                return true;
              return false;
            })
            .map((page, idx, arr) => {
              // Add ellipsis
              const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
              return (
                <div key={page} className="flex items-center gap-1">
                  {showEllipsisBefore && (
                    <span className="px-2 text-slate-400">...</span>
                  )}
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 w-10 p-0 ${
                      currentPage === page
                        ? "bg-blue-600 hover:bg-blue-700"
                        : ""
                    }`}
                  >
                    {page}
                  </Button>
                </div>
              );
            })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="h-10 px-4"
        >
          ถัดไป
        </Button>
      </div>

      {/* Page Info */}
      <div className="text-sm text-slate-500">
        หน้า {currentPage} จาก {totalPages}
      </div>
    </div>
  );
}
