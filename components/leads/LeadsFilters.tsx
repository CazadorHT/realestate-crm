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
import {
  LEAD_STAGE_ORDER,
  LEAD_SOURCE_ORDER,
  leadStageLabelNullable,
  leadSourceLabelNullable,
} from "@/features/leads/labels";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { SlidersHorizontal, Search, RotateCcw } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function LeadsFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const isEn = language === "en";

  const initialQ = sp.get("q") ?? "";
  const initialStage = sp.get("stage") ?? "ALL";
  const initialSource = sp.get("source") ?? "ALL";
  const initialLeadType = sp.get("lead_type") ?? "all";

  const [q, setQ] = useState(initialQ);
  const [stage, setStage] = useState(initialStage);
  const [source, setSource] = useState(initialSource);
  const [leadType, setLeadType] = useState(initialLeadType);

  const buildQueryString = (overrideLeadType?: string) => {
    const p = new URLSearchParams(sp.toString());
    if (q.trim()) p.set("q", q.trim());
    else p.delete("q");

    if (stage && stage !== "ALL") p.set("stage", stage);
    else p.delete("stage");

    if (source && source !== "ALL") p.set("source", source);
    else p.delete("source");

    const activeType = overrideLeadType !== undefined ? overrideLeadType : leadType;
    if (activeType && activeType !== "all") p.set("lead_type", activeType);
    else p.delete("lead_type");

    p.delete("page");
    return p.toString();
  };

  const queryString = useMemo(() => buildQueryString(), [q, stage, source, leadType, sp]);

  const apply = (overrideType?: string) => {
    startTransition(() => {
      router.push(`/protected/leads?${buildQueryString(overrideType)}`);
    });
    setIsOpen(false);
  };

  const handleLeadTypeChange = (type: "all" | "deposit" | "inquiry") => {
    setLeadType(type);
    apply(type);
  };

  const clear = () => {
    setQ("");
    setStage("ALL");
    setSource("ALL");
    setLeadType("all");
    startTransition(() => {
      router.push(`/protected/leads`);
    });
    setIsOpen(false);
  };

  const activeFilterCount = (stage !== "ALL" ? 1 : 0) + (source !== "ALL" ? 1 : 0) + (leadType !== "all" ? 1 : 0);

  return (
    <div className="space-y-3 w-full">
      {/* Quick Filter Segmented Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-fit border border-slate-200/80 shadow-inner">
        <button
          type="button"
          onClick={() => handleLeadTypeChange("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            leadType === "all"
              ? "bg-white text-slate-900 shadow-xs ring-1 ring-black/5"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>👥</span>
          <span>{isEn ? "All Leads" : "ลีดทั้งหมด"}</span>
        </button>
        <button
          type="button"
          onClick={() => handleLeadTypeChange("deposit")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            leadType === "deposit"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-emerald-700 hover:bg-emerald-50/60"
          }`}
        >
          <span>🏠</span>
          <span>{isEn ? "Deposits (ฝากทรัพย์)" : "ฝากทรัพย์"}</span>
        </button>
        <button
          type="button"
          onClick={() => handleLeadTypeChange("inquiry")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            leadType === "inquiry"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-blue-700 hover:bg-blue-50/60"
          }`}
        >
          <span>💬</span>
          <span>{isEn ? "Inquiries (สนใจซื้อ/เช่า)" : "สนใจซื้อ-เช่า"}</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center w-full">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder={isEn ? "Search (Name / Phone / Email)..." : "ค้นหา (ชื่อ/เบอร์/อีเมล)"}
              className="pl-9 h-11 md:h-10 border-slate-200 focus:ring-blue-500 rounded-xl md:rounded-lg"
            />
          </div>

          {/* Mobile Filter Trigger */}
          <div className="flex md:hidden">
            <ResponsiveDialog
              open={isOpen}
              onOpenChange={setIsOpen}
              title={isEn ? "Lead Filters" : "ตัวกรองลูกค้า"}
              description={isEn ? "Filter leads by status and source" : "ปรับแต่งการหาลูกค้าตามสถานะ"}
              trigger={
                <Button 
                  variant={activeFilterCount > 0 ? "default" : "outline"}
                  className="h-11 w-11 p-0 rounded-xl border-slate-200 cursor-pointer"
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
                    className="h-12 rounded-xl border-slate-200 font-bold cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isEn ? "Reset" : "ล้างค่า"}
                  </Button>
                  <Button 
                    onClick={() => apply()} 
                    className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 cursor-pointer"
                  >
                    {isEn ? "Apply" : "ตกลง"}
                  </Button>
                </div>
              }
            >
              <div className="space-y-4 p-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    {isEn ? "Lead Stage" : "สถานะของลีด"}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setStage("ALL")}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold cursor-pointer ${
                        stage === "ALL"
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white border-slate-100 text-slate-600"
                      }`}
                    >
                      {isEn ? "All Stages" : "ทุกสถานะ"}
                    </button>
                    {LEAD_STAGE_ORDER.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStage(s)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold cursor-pointer ${
                          stage === s
                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                            : "bg-white border-slate-100 text-slate-600"
                        }`}
                      >
                        {leadStageLabelNullable(s, language)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                    {isEn ? "Lead Source" : "แหล่งที่มาของลีด"}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setSource("ALL")}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold cursor-pointer ${
                        source === "ALL"
                          ? "bg-slate-900 border-slate-900 text-white"
                          : "bg-white border-slate-100 text-slate-600"
                      }`}
                    >
                      {isEn ? "All Sources" : "ทุกแหล่งที่มา"}
                    </button>
                    {LEAD_SOURCE_ORDER.map((src) => (
                      <button
                        key={src}
                        onClick={() => setSource(src)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold cursor-pointer ${
                          source === src
                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                            : "bg-white border-slate-100 text-slate-600"
                        }`}
                      >
                        {leadSourceLabelNullable(src, language)}
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
              <SelectTrigger className="w-44 bg-white cursor-pointer">
                <SelectValue placeholder={isEn ? "Stage" : "สถานะ"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{isEn ? "All Stages" : "ทุกสถานะ"}</SelectItem>
                {LEAD_STAGE_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {leadStageLabelNullable(s, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-44 bg-white cursor-pointer">
                <SelectValue placeholder={isEn ? "Source" : "แหล่งที่มา"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{isEn ? "All Sources" : "ทุกแหล่งที่มา"}</SelectItem>
                {LEAD_SOURCE_ORDER.map((src) => (
                  <SelectItem key={src} value={src}>
                    {leadSourceLabelNullable(src, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => apply()} 
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 font-bold cursor-pointer"
            >
              {isEn ? "Search" : "ค้นหา"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={clear} 
              disabled={isPending}
              className="text-slate-500 hover:text-slate-700 font-bold cursor-pointer"
            >
              {isEn ? "Reset" : "ล้างค่า"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
