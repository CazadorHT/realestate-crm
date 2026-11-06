"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompareProperty } from "./types";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CompareActionRowProps {
  properties: CompareProperty[];
}

export function CompareActionRow({ properties }: CompareActionRowProps) {
  const { t, langPrefix } = useLanguage();
  return (
    <div
      className="grid divide-x divide-slate-100 bg-white border-t border-slate-200"
      style={{
        gridTemplateColumns: `var(--compare-label-w, 105px) repeat(${properties.length}, minmax(130px, 1fr))`,
      }}
    >
      <div className="sticky left-0 bg-white z-10 px-2 sm:px-3.5 py-2 sm:py-3 border-r border-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]" />
      {properties.map((p) => (
        <div key={p.id} className="p-2 sm:p-3 md:p-4 flex items-center justify-center">
          <Button
            className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 transition-all text-xs sm:text-sm py-2 sm:py-2.5 font-bold shadow-xs cursor-pointer"
            asChild
          >
            <Link href={`${langPrefix || ""}/properties/${p.slug || p.id}`}>
              {t("compare_page.view_details") || "ดูรายละเอียด"}
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
