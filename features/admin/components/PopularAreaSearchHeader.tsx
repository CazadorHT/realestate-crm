"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";

interface PopularAreaSearchHeaderProps {
  totalCount: number;
}

export function PopularAreaSearchHeader({
  totalCount,
}: PopularAreaSearchHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-driven state
  const search = searchParams.get("search") || "";
  const [searchValue, setSearchValue] = useState(search);

  // Sync state if URL changes externally
  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  // Debounced search logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== search) {
        const params = new URLSearchParams(searchParams);
        if (searchValue) params.set("search", searchValue);
        else params.delete("search");
        params.set("page", "1"); // Reset to page 1 on new search
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, search, searchParams, pathname, router]);

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-5 border border-slate-200 shadow-sm rounded-2xl animate-in fade-in duration-500">
      <div className="flex items-center gap-4 text-left">
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
          <MapPin className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            ทำเลยอดนิยม ({totalCount})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            จัดการลำดับและข้อมูลสำคัญสำหรับหน้าบ้าน
          </p>
        </div>
      </div>
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="ค้นหาทำเล..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl"
        />
      </div>
    </div>
  );
}
