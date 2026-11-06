"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X, Scale } from "lucide-react";
import { clearCompare, readCompareIds } from "@/lib/compare-store";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function CompareBar() {
  const [ids, setIds] = useState<string[]>([]);
  const pathname = usePathname();
  const { t, langPrefix } = useLanguage();

  useEffect(() => {
    setIds(readCompareIds());

    const onStorage = () => setIds(readCompareIds());
    // Listen for both cross-tab storage changes and local custom events
    window.addEventListener("storage", onStorage);
    window.addEventListener("compare-updated", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("compare-updated", onStorage);
    };
  }, []);

  // Hide floating dock when already on /compare page or on /map (map has its own dock)
  if (
    ids.length === 0 ||
    pathname?.includes("/compare") ||
    pathname?.includes("/map")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-1.5 bg-[#1B263B]/95 hover:bg-slate-900 text-white p-1.5 pl-3 rounded-full shadow-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-105 group">
        <Link
          href={`${langPrefix || ""}/compare?ids=${ids.join(",")}`}
          className="flex items-center gap-2 pr-1 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold whitespace-nowrap">
            {t("compare_bar.compare_btn") || "เปรียบเทียบ"}
          </span>
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-white text-slate-900 text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">
            {ids.length}
          </span>
        </Link>

        {/* Quick Clear Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            clearCompare();
            setIds([]);
          }}
          className="w-6 h-6 rounded-full text-slate-400 hover:text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          title={t("compare_bar.clear") || "Clear"}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
