"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { LEAD_STAGE_ORDER, LEAD_STAGE_LABELS } from "@/features/leads/labels";

export function LeadsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialQ = sp.get("q") ?? "";
  const initialStage = sp.get("stage") ?? "ALL";

  const [q, setQ] = useState(initialQ);
  const [stage, setStage] = useState(initialStage);

  const queryString = useMemo(() => {
    const p = new URLSearchParams(sp.toString());
    if (q.trim()) p.set("q", q.trim());
    else p.delete("q");

    if (stage && stage !== "ALL") p.set("stage", stage);
    else p.delete("stage");

    p.delete("page"); // เปลี่ยน filter แล้วกลับหน้า 1
    return p.toString();
  }, [q, stage, sp]);

  const apply = () =>
    startTransition(() => {
      router.push(`/protected/leads?${queryString}`);
    });

  const clear = () =>
    startTransition(() => {
      router.push(`/protected/leads`);
    });

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา (ชื่อ/เบอร์/อีเมล)"
          className="md:max-w-sm"
        />

        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="md:w-[220px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกสถานะ</SelectItem>
            {LEAD_STAGE_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {LEAD_STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={apply} disabled={isPending}>
          ค้นหา
        </Button>
        <Button variant="outline" onClick={clear} disabled={isPending}>
          ล้างค่า
        </Button>
      </div>
    </div>
  );
}
