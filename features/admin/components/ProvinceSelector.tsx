"use client";

import { useThaiAddress } from "@/hooks/useThaiAddress";
import {
  Select as ShadcnSelect,
  SelectContent as ShadcnSelectContent,
  SelectItem as ShadcnSelectItem,
  SelectTrigger as ShadcnSelectTrigger,
  SelectValue as ShadcnSelectValue,
} from "@/components/ui/select";

export function ProvinceSelector({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const { provinces, loading } = useThaiAddress();

  return (
    <ShadcnSelect value={value} onValueChange={onChange} disabled={loading}>
      <ShadcnSelectTrigger 
        className={className || "h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl"}
      >
        <ShadcnSelectValue placeholder={loading ? "กำลังโหลด..." : "เลือกจังหวัด"} />
      </ShadcnSelectTrigger>
      <ShadcnSelectContent className="max-h-[300px]">
        {provinces.map((p) => (
          <ShadcnSelectItem key={p.id} value={p.name_th}>
            {p.name_th}
          </ShadcnSelectItem>
        ))}
      </ShadcnSelectContent>
    </ShadcnSelect>
  );
}
