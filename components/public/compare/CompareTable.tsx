"use client";

import { CompareProperty, ComparisonRow } from "./types";
import { ComparePropertyHeader } from "./ComparePropertyHeader";
import { CompareRow } from "./CompareRow";
import { CompareActionRow } from "./CompareActionRow";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface CompareTableProps {
  properties: CompareProperty[];
  rows: ComparisonRow[];
  onRemove: (id: string) => void;
}

export function CompareTable({
  properties,
  rows,
  onRemove,
}: CompareTableProps) {
  const { t } = useLanguage();
  return (
    <div className="overflow-x-auto pb-4 md:pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="min-w-[600px] md:min-w-[800px] border border-slate-200 rounded-2xl md:rounded-3xl bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm">
        {/* Header Row (Images & Titles) */}
        <div
          className="grid divide-x divide-slate-100"
          style={{
            gridTemplateColumns: `150px repeat(${properties.length}, 1fr)`,
          }}
        >
          <div className="p-3 md:p-6 flex items-center font-bold text-xs md:text-sm text-slate-900 bg-slate-50/80">
            {t("compare_page.topics")}
          </div>
          {properties.map((p) => (
            <ComparePropertyHeader
              key={p.id}
              property={p}
              onRemove={onRemove}
            />
          ))}
        </div>

        {/* Data Rows */}
        {rows.map((row, idx) => (
          <CompareRow
            key={row.key}
            row={row}
            properties={properties}
            idx={idx}
          />
        ))}

        {/* Action Row */}
        <CompareActionRow properties={properties} />
      </div>
    </div>
  );
}
