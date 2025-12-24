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

interface LeadSelectProps {
  value?: string;
  onChange: (val: string) => void;
}

export function LeadSelect({ value, onChange }: LeadSelectProps) {
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
        setOpts((payload.data ?? []).map((l: any) => ({ id: l.id, full_name: l.full_name })));
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
      <div className="text-sm text-muted-foreground">เลือกลีด</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "กำลังโหลด..." : "เลือกลีด"} />
        </SelectTrigger>
        <SelectContent>
          {opts.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
