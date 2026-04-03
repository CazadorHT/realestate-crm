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
import { ResponsiveDialog, DialogClose } from "@/components/ui/responsive-dialog";
import { SlidersHorizontal, Search, RotateCcw } from "lucide-react";

export function LeadsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

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

    p.delete("page");
    return p.toString();
  }, [q, stage, sp]);

  const apply = () => {
    startTransition(() => {
      router.push(`/protected/leads?${queryString}`);
    });
    setIsOpen(false);
  };

  const clear = () => {
    setQ("");
    setStage("ALL");
    startTransition(() => {
      router.push(`/protected/leads`);
    });
    setIsOpen(false);
  };

  const activeFilterCount = stage !== "ALL" ? 1 : 0;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center w-full">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="ค้นหา (ชื่อ/เบอร์/อีเมล)"
            className="pl-9 h-11 md:h-10 border-slate-200 focus:ring-blue-500 rounded-xl md:rounded-lg"
          />
        </div>

        {/* Mobile Filter Trigger */}
        <div className="flex md:hidden">
          <ResponsiveDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            title="ตัวกรองลูกค้า"
            description="ปรับแต่งการหาลูกค้าตามสถานะ"
            trigger={
              <Button 
                variant={activeFilterCount > 0 ? "default" : "outline"}
                className="h-11 w-11 p-0 rounded-xl border-slate-200"
              >
                <SlidersHorizontal className="h-5 w-5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold ring-2 ring-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            }
            footer={
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button 
                  variant="outline" 
                  onClick={clear} 
                  className="h-12 rounded-xl border-slate-200 font-bold"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  ล้างค่า
                </Button>
                <Button 
                  onClick={apply} 
                  className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200"
                >
                  ตกลง
                </Button>
              </div>
            }
          >
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  สถานะของลีด
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setStage("ALL")}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold ${
                      stage === "ALL"
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-slate-100 text-slate-600"
                    }`}
                  >
                    ทุกสถานะ
                  </button>
                  {LEAD_STAGE_ORDER.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStage(s)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold ${
                        stage === s
                          ? "bg-blue-600 border-blue-600 text-white shadow-md"
                          : "bg-white border-slate-100 text-slate-600"
                      }`}
                    >
                      {LEAD_STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ResponsiveDialog>
        </div>

        {/* Desktop Inline Filters */}
        <div className="hidden md:flex items-center gap-2">
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="w-[180px] bg-white">
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

          <Button 
            onClick={apply} 
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 font-bold"
          >
            ค้นหา
          </Button>
          <Button 
            variant="ghost" 
            onClick={clear} 
            disabled={isPending}
            className="text-slate-500 hover:text-slate-700 font-bold"
          >
            ล้างค่า
          </Button>
        </div>
      </div>
    </div>
  );
}
