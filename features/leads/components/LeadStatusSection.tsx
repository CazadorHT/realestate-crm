"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Search, DollarSign, Info, ChevronRight, Check, Globe, Star, MessageSquare, Eye, Handshake, CheckCircle } from "lucide-react";
import { 
  RiFacebookCircleFill, 
  RiInstagramLine, 
  RiMessengerFill 
} from "react-icons/ri";
import { 
  SiLine, 
  SiTiktok, 
  SiGoogle, 
  SiWhatsapp 
} from "react-icons/si";
import { 
  FaUserFriends, 
  FaSearch, 
  FaQuestionCircle 
} from "react-icons/fa";
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
import { cn } from "@/lib/utils";
import { ResponsiveDialog, DialogClose } from "@/components/ui/responsive-dialog";
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

const STAGE_CONFIG: Record<string, { icon: any; color: string; bgColor: string; borderColor: string }> = {
  NEW: { icon: Star, color: "text-blue-600", bgColor: "bg-blue-100", borderColor: "border-blue-200" },
  CONTACTED: { icon: MessageSquare, color: "text-amber-600", bgColor: "bg-amber-100", borderColor: "border-amber-200" },
  VIEWED: { icon: Eye, color: "text-purple-600", bgColor: "bg-purple-100", borderColor: "border-purple-200" },
  NEGOTIATING: { icon: Handshake, color: "text-indigo-600", bgColor: "bg-indigo-100", borderColor: "border-indigo-200" },
  CLOSED: { icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-100", borderColor: "border-emerald-200" },
};

const SOURCE_CONFIG: Record<string, { icon: any; color: string; activeBg: string }> = {
  FACEBOOK: { icon: RiFacebookCircleFill, color: "text-blue-600", activeBg: "bg-blue-600" },
  LINE: { icon: SiLine, color: "text-green-500", activeBg: "bg-green-500" },
  INSTAGRAM: { icon: RiInstagramLine, color: "text-pink-600", activeBg: "bg-pink-600" },
  TIKTOK: { icon: SiTiktok, color: "text-slate-900", activeBg: "bg-slate-900" },
  WEBSITE: { icon: Globe, color: "text-sky-500", activeBg: "bg-sky-500" },
  REFERRAL: { icon: FaUserFriends, color: "text-violet-500", activeBg: "bg-violet-500" },
  PORTAL: { icon: FaSearch, color: "text-slate-500", activeBg: "bg-slate-500" },
  WHATSAPP: { icon: SiWhatsapp, color: "text-emerald-500", activeBg: "bg-emerald-500" },
  OTHER: { icon: FaQuestionCircle, color: "text-slate-400", activeBg: "bg-slate-400" },
};

export function LeadStatusSection({ form }: LeadStatusSectionProps) {
  return (
    <Card className="shadow-lg border-slate-200 overflow-hidden">
      <CardHeader className="bg-linear-to-r from-violet-600 to-indigo-600 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-white/20 text-white shadow-inner backdrop-blur-sm">
            <Search className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-white font-semibold">
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
          {/* Stage Picker */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
              Stage (สถานะลูกค้า)
            </Label>
            <ResponsiveDialog
              title="เลือกสถานะลูกค้า"
              description="อัปเดตความคืบหน้าของลีดรายนี้"
              trigger={
                <button
                  type="button"
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-all flex items-center justify-between group shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const stage = form.watch("stage");
                      const config = STAGE_CONFIG[stage] || STAGE_CONFIG.NEW;
                      const Icon = config.icon;
                      return (
                        <>
                          <div className={cn(
                            "h-6 px-2 rounded-md flex items-center justify-center text-[10px] font-semibold tracking-wider uppercase border",
                            config.bgColor, config.color, config.borderColor
                          )}>
                             <Icon className="h-3 w-3 mr-1" />
                             {stage}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            {LEAD_STAGE_LABELS[stage as keyof typeof LEAD_STAGE_LABELS]}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </button>
              }
            >
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEAD_STAGE_ORDER.map((s) => {
                  const config = STAGE_CONFIG[s] || STAGE_CONFIG.NEW;
                  const Icon = config.icon;
                  const isSelected = form.watch("stage") === s;
                  
                  return (
                    <DialogClose key={s} asChild>
                      <button
                        type="button"
                        onClick={() => form.setValue("stage", s as any)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.02] z-10"
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-white/20" : cn(config.bgColor, config.color)
                          )}>
                            <Icon className="h-6! w-6!" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-0.5">{s}</span>
                            <span className="text-sm font-semibold">{LEAD_STAGE_LABELS[s]}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-white animate-in zoom-in duration-300" />}
                      </button>
                    </DialogClose>
                  );
                })}
              </div>
            </ResponsiveDialog>
          </div>

          {/* Source Picker */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 ml-1">
              Source (ที่มาของลีด)
            </Label>
            <ResponsiveDialog
              title="แหล่งที่มาของลูกค้า"
              description="ระบุว่าลูกค้ารู้จักเราผ่านช่องทางใด"
              trigger={
                <button
                  type="button"
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-all flex items-center justify-between group shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    {(() => {
                      const source = form.watch("source") || "OTHER";
                      const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.OTHER;
                      const Icon = config.icon;
                      return (
                        <>
                          <div className={cn("h-10! w-10! rounded-lg flex items-center justify-center", config.color, "bg-slate-50")}>
                            <Icon className="h-4! w-4!" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            {LEAD_SOURCE_LABELS[source as keyof typeof LEAD_SOURCE_LABELS]}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </button>
              }
            >
              <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LEAD_SOURCE_ORDER.map((s) => {
                  const config = SOURCE_CONFIG[s] || SOURCE_CONFIG.OTHER;
                  const Icon = config.icon;
                  const isSelected = (form.watch("source") || "OTHER") === s;

                  return (
                    <DialogClose key={s} asChild>
                      <button
                        type="button"
                        onClick={() => form.setValue("source", s as any)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center gap-2",
                          isSelected
                            ? "bg-blue-700 border-blue-700 text-white shadow-lg active:scale-95"
                            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <div className={cn(
                          "h-10! w-10! rounded-full flex items-center justify-center",
                          isSelected ? "bg-white/20" : cn("bg-slate-50", config.color)
                        )}>
                          <Icon className="h-6! w-6!" />
                        </div>
                        <span className="text-[11px] font-semibold leading-tight">{LEAD_SOURCE_LABELS[s]}</span>
                      </button>
                    </DialogClose>
                  );
                })}
              </div>
            </ResponsiveDialog>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-indigo-900/70 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-indigo-500" />{" "}
            งบประมาณที่คาดหวัง (Budget)
          </Label>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-indigo-100 rounded text-[10px] font-semibold text-indigo-600">
                MIN
              </div>
              <Input
                type="number"
                className="pl-14 text-right pr-4 h-12 text-lg font-semibold text-indigo-900 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm"
                placeholder="0"
                {...form.register("budget_min", { valueAsNumber: true })}
              />
              {form.formState.errors.budget_min && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  {form.formState.errors.budget_min.message}
                </p>
              )}
            </div>
            <div className="text-indigo-300 font-medium">ถึง</div>
            <div className="relative flex-1 group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-indigo-100 rounded text-[10px] font-semibold text-indigo-600">
                MAX
              </div>
              <Input
                type="number"
                className="pl-14 text-right pr-4 h-12 text-lg font-semibold text-indigo-900 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20 bg-white shadow-sm"
                placeholder="ไม่อั้น"
                {...form.register("budget_max", { valueAsNumber: true })}
              />
              {form.formState.errors.budget_max && (
                <p className="text-red-500 text-xs font-semibold mt-1">
                  {form.formState.errors.budget_max.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
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
