"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isPending?: boolean;
}

export function QuickSearch({
  value,
  onChange,
  onSearch,
  isPending,
}: QuickSearchProps) {
  const isInitialMount = useRef(true);
  const { language } = useLanguage();
  const isEn = language === "en";

  // [FAST INSTANT SEARCH] Debounce search execution (optimized to 280ms for instant responsiveness)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only search if the local value actually differs from the URL state 
    // to prevent infinite loops during state sync.
    const urlParams = new URLSearchParams(window.location.search);
    const currentUrlQ = urlParams.get("q") || "";

    if (value === currentUrlQ) return;

    const timer = setTimeout(() => {
      onSearch();
    }, 280);

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  const handleClear = () => {
    onChange("");
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("q")) {
      setTimeout(() => onSearch(), 0);
    }
  };

  return (
    <div className="relative flex-1 group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center pointer-events-none">
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
        ) : (
          <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        )}
      </div>
      <Input
        placeholder={
          isEn
            ? "Search by project, title, location, ID..."
            : "ค้นหาตามชื่อโครงการ, ชื่อทรัพย์, ทำเล, รหัส..."
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSearch();
          }
        }}
        className="pl-9 pr-9 w-full h-9 rounded-full bg-white border-slate-200 focus-visible:ring-blue-500 shadow-xs text-xs font-medium"
      />
      {Boolean(value) && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
          title={isEn ? "Clear search" : "ล้างคำค้นหา"}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

