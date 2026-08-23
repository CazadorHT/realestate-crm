"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface LeadSelectProps {
  value?: string;
  onChange: (val: string) => void;
}

export function LeadSelect({ value, onChange }: LeadSelectProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [opts, setOpts] = useState<Array<{ id: string; full_name: string }>>(
    []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchLeads() {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("pageSize", "200");
      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!mounted) return;
      if (res.ok) {
        const payload = await res.json();
        setOpts(
          (payload.data ?? []).map((l: { id: string; full_name: string }) => ({
            id: l.id,
            full_name: l.full_name,
          }))
        );
      }
      setLoading(false);
    }
    fetchLeads();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="cursor-pointer">
          <SelectValue placeholder={loading ? (isEn ? "Loading..." : "กำลังโหลด...") : (isEn ? "Select Lead" : "เลือกลีด")} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          {opts.map((l) => (
            <SelectItem key={l.id} value={l.id} className="cursor-pointer">
              {l.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

