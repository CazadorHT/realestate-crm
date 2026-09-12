"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Download, Loader2, Sparkles, Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";
import { STARTER_TEMPLATES, type StarterTemplate } from "../constants/starter-templates";
import type { AspectRatio } from "../types";

interface StudioPresetManagerProps {
  availablePresets: Record<string, any>;
  isLoading: boolean;
  onApplyPreset: (key: string) => void;
  onApplyCuratedPreset?: (presetId: string) => void;
  onSavePreset: (key: string) => void;
  currentAspectRatio?: AspectRatio;
}

export function StudioPresetManager({
  availablePresets,
  isLoading,
  onApplyPreset,
  onApplyCuratedPreset,
  onSavePreset,
  currentAspectRatio,
}: StudioPresetManagerProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"all" | AspectRatio>("all");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const presetKeys = ["CUSTOM_1", "CUSTOM_2", "CUSTOM_3", "CUSTOM_4", "CUSTOM_5"];
  const getPresetLabel = (key: string) => {
    const num = key.split("_")[1];
    return `Custom ${num}`;
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);
    await onSavePreset(key);
    setSavingKey(null);
  };

  const filteredTemplates = STARTER_TEMPLATES.filter((tpl) => {
    if (selectedCategory === "all") return true;
    return tpl.ratio === selectedCategory;
  });

  const handleSelectTemplate = (tpl: StarterTemplate) => {
    setActiveTemplateId(tpl.id);
    onApplyCuratedPreset?.(tpl.id);
  };

  return (
    <div className="mb-4 p-4 border border-amber-500/30 bg-slate-950/70 rounded-2xl space-y-3.5 shadow-md">
      {/* 1-Click Pro Starter Templates Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                {isEn ? "Smart Starter Templates" : "แม่แบบเริ่มต้นอัตโนมัติ (Starter Templates)"}
                <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                  1-Click
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {isEn
                  ? "Auto-arranges ratio, layout, text cards, and effects instantly"
                  : "จัดสัดส่วนภาพ + Layout รูปภาพ + วางข้อความ + เอฟเฟกต์เบลอในคลิกเดียว"}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono hidden sm:inline">
            {filteredTemplates.length} {isEn ? "Templates" : "แม่แบบ"}
          </span>
        </div>

        {/* Category Ratio Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: isEn ? "🌟 All Templates" : "🌟 ทั้งหมด" },
            { id: "3:2", label: isEn ? "3:2 FB Horizontal" : "3:2 FB ปกนอน" },
            { id: "2:3", label: isEn ? "2:3 FB Vertical" : "2:3 FB ปกตั้ง" },
            { id: "1:1", label: isEn ? "1:1 Square" : "1:1 จัตุรัส" },
            { id: "9:16", label: isEn ? "9:16 Story / Reel" : "9:16 สตอรี่" },
            { id: "4:5", label: isEn ? "4:5 IG Feed" : "4:5 ไอจีฟีด" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs scale-102 font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950">
          {filteredTemplates.map((tpl) => {
            const isCurrentRatio = currentAspectRatio === tpl.ratio;
            const isSelected = activeTemplateId === tpl.id;

            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group shadow-xs relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "border-amber-400 bg-linear-to-br from-amber-500/25 via-slate-900 to-slate-950 ring-2 ring-amber-400/30 scale-102"
                    : isCurrentRatio
                      ? "border-slate-700 hover:border-amber-400/80 bg-slate-900/80 hover:bg-slate-900"
                      : "border-slate-800/80 hover:border-slate-600 bg-slate-950/60 hover:bg-slate-900/60 opacity-85 hover:opacity-100"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base">{tpl.icon}</span>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                          tpl.badgeColor === "amber"
                            ? "bg-amber-500 text-slate-950"
                            : tpl.badgeColor === "indigo"
                              ? "bg-indigo-500 text-white"
                              : tpl.badgeColor === "red"
                                ? "bg-red-500 text-white"
                                : tpl.badgeColor === "cyan"
                                  ? "bg-cyan-500 text-slate-950"
                                  : tpl.badgeColor === "purple"
                                    ? "bg-purple-500 text-white"
                                    : "bg-emerald-500 text-slate-950"
                        }`}
                      >
                        {isEn ? tpl.badge.en : tpl.badge.th}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 rounded-sm">
                        {tpl.ratio}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                    {isEn ? tpl.name.en : tpl.name.th}
                  </div>
                  <div className="text-[9px] text-amber-400/90 font-medium mt-0.5 leading-tight">
                    {isEn ? tpl.subtitle.en : tpl.subtitle.th}
                  </div>
                  <p className="text-[8.5px] text-slate-400 mt-1 leading-snug line-clamp-2">
                    {isEn ? tpl.description.en : tpl.description.th}
                  </p>
                </div>

                {/* Footer Tag & Auto-indicator */}
                <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[8.5px]">
                  <span className="text-slate-400 font-mono">
                    {tpl.config.layout} • {tpl.config.cardBackground}
                  </span>
                  <span className="text-amber-300 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    {isEn ? "Apply" : "ใช้งาน"} →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-slate-800/80" />

      {/* User Custom Saved Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold flex items-center text-indigo-400">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            {isEn ? "My Custom Saved Presets" : "พรีเซ็ตที่ฉันบันทึกไว้ (Custom Presets)"}
          </h3>
          <p className="text-[10px] text-indigo-400/70">
            {isEn ? "Save layout & colors" : "บันทึกการจัดวางและโทนสี"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-4 border border-slate-800 rounded-xl bg-slate-900/50">
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-400" />
            <span className="text-xs text-slate-400">
              {isEn ? "Loading custom presets..." : "กำลังโหลดพรีเซ็ต..."}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {presetKeys.map((key) => {
              const hasData = !!availablePresets[key];
              const isSaving = savingKey === key;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-lg border transition-all",
                    hasData
                      ? "border-indigo-500/50 bg-indigo-500/10 hover:border-indigo-400 hover:bg-indigo-500/20"
                      : "border-dashed border-slate-700 bg-slate-800/40"
                  )}
                >
                  <button
                    type="button"
                    disabled={!hasData || isSaving}
                    onClick={() => onApplyPreset(key)}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center p-2 text-center group",
                      !hasData && "opacity-50 cursor-not-allowed"
                    )}
                    title={
                      hasData
                        ? (isEn ? `Apply ${getPresetLabel(key)}` : `ใช้งาน ${getPresetLabel(key)}`)
                        : (isEn ? "Empty Preset" : "ยังไม่มีข้อมูล")
                    }
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-colors",
                        hasData ? "bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white" : "bg-slate-700 text-slate-500"
                      )}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </div>
                    <span className={cn("text-[10px] font-medium truncate w-full", hasData ? "text-slate-200" : "text-slate-500")}>
                      {getPresetLabel(key)}
                    </span>
                  </button>

                  <div className="h-px w-full bg-slate-700/50" />

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave(key)}
                    className="w-full flex items-center justify-center py-1.5 text-[10px] text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-colors"
                    title={isEn ? `Save current settings to ${getPresetLabel(key)}` : `บันทึกการตั้งค่าปัจจุบันลง ${getPresetLabel(key)}`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-1" />
                        {isEn ? "Save" : "บันทึก"}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
