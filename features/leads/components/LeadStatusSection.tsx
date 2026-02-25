"use client";

import { UseFormReturn } from "react-hook-form";
import { Search, DollarSign, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LEAD_STAGE_ORDER,
  LEAD_SOURCE_ORDER,
  LEAD_STAGE_LABELS,
  LEAD_SOURCE_LABELS,
} from "../labels";
import { LeadFormValues } from "../types";

interface LeadStatusSectionProps {
  form: UseFormReturn<LeadFormValues>;
}

export function LeadStatusSection({ form }: LeadStatusSectionProps) {
  return (
    <Card className="shadow-lg border-slate-200 overflow-hidden">
      <CardHeader className="bg-linear-to-r from-violet-600 to-indigo-600 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-white font-bold">
              สถานะและงบประมาณ
            </CardTitle>
            <CardDescription className="text-indigo-100">
              ติดตามความคืบหน้าและประเมินงบประมาณ
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Stage (สถานะ)
            </Label>
            <Select
              value={form.watch("stage")}
              onValueChange={(v) => form.setValue("stage", v as any)}
            >
              <SelectTrigger className="w-full h-11 border-slate-200 rounded-xl bg-slate-50/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STAGE_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          s === "NEW"
                            ? "default"
                            : s === "CLOSED"
                              ? "secondary"
                              : "outline"
                        }
                        className="rounded-md px-1.5 py-0.5 text-[10px] h-auto"
                      >
                        {s}
                      </Badge>
                      {LEAD_STAGE_LABELS[s]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Source (ที่มา)
            </Label>
            <Select
              value={form.watch("source") ?? "OTHER"}
              onValueChange={(v) => form.setValue("source", (v as any) || null)}
            >
              <SelectTrigger className="w-full h-11 border-slate-200 rounded-xl bg-slate-50/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCE_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LEAD_SOURCE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 space-y-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-indigo-900/70 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-indigo-500" />{" "}
            งบประมาณที่คาดหวัง (Budget)
          </Label>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-indigo-100 rounded text-[10px] font-bold text-indigo-600">
                MIN
              </div>
              <Input
                type="number"
                className="pl-14 text-right pr-4 h-12 text-lg font-semibold text-indigo-900 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm"
                placeholder="0"
                {...form.register("budget_min", { valueAsNumber: true })}
              />
            </div>
            <div className="text-indigo-300 font-medium">ถึง</div>
            <div className="relative flex-1 group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-indigo-100 rounded text-[10px] font-bold text-indigo-600">
                MAX
              </div>
              <Input
                type="number"
                className="pl-14 text-right pr-4 h-12 text-lg font-semibold text-indigo-900 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm"
                placeholder="ไม่อั้น"
                {...form.register("budget_max", { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Info className="h-3.5 w-3.5" /> บันทึกเพิ่มเติม
          </Label>
          <Textarea
            className="min-h-[100px] bg-slate-50/50 border-slate-200 rounded-xl resize-y focus:border-slate-400 focus:ring-slate-400/20"
            placeholder="รายละเอียดอื่นๆ..."
            {...form.register("note")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
