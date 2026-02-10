"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompareProperty } from "./types";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CompareActionRowProps {
  properties: CompareProperty[];
}

export function CompareActionRow({ properties }: CompareActionRowProps) {
  const { t } = useLanguage();
  return (
    <div
      className="grid divide-x divide-slate-100 bg-white border-t border-slate-100"
      style={{
        gridTemplateColumns: `150px repeat(${properties.length}, 1fr)`,
      }}
    >
      <div className="p-3 md:p-6"></div>
      {properties.map((p) => (
        <div key={p.id} className="p-3 md:p-6">
          <Button
            className="w-full rounded-lg md:rounded-xl bg-slate-900 hover:bg-slate-800 transition-all hover:scale-105 text-xs md:text-sm py-2 md:py-3"
            asChild
          >
            <Link href={`/properties/${p.id}`}>
              {t("compare_page.view_details")}
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
