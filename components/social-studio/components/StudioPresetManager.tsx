"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Download, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioPresetManagerProps {
  availablePresets: Record<string, any>;
  isLoading: boolean;
  onApplyPreset: (key: string) => void;
  onApplyCuratedPreset?: (presetId: string) => void;
  onSavePreset: (key: string) => void;
}

export function StudioPresetManager({
  availablePresets,
  isLoading,
  onApplyPreset,
  onApplyCuratedPreset,
  onSavePreset,
}: StudioPresetManagerProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null);

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



  return (
    <div className="mb-4 p-4 border border-amber-500/30 bg-slate-950/70 rounded-2xl space-y-3.5 shadow-md">
      {/* 1-Click Pro Templates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold flex items-center text-amber-300">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            1-Click Pro Templates
          </h3>
          <span className="text-[10px] text-amber-400/80 font-mono">Ready to Publish</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onApplyCuratedPreset?.("phuket_frosted_luxury")}
            className="p-2.5 rounded-xl border border-amber-500/50 bg-linear-to-br from-amber-500/15 via-slate-900 to-slate-950 text-left hover:border-amber-400 hover:scale-102 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">💎</span>
              <span className="text-[8px] bg-amber-500 text-slate-950 font-black px-1 rounded-sm">HOT</span>
            </div>
            <div className="text-[11px] font-bold text-amber-200 group-hover:text-amber-100">
              Phuket Frosted Card
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
              Glass Spec Pills + Gold Price + Freehold
            </div>
          </button>

          <button
            type="button"
            onClick={() => onApplyCuratedPreset?.("editorial_luxury")}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/40 text-left hover:border-amber-400/70 hover:scale-102 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">🏛️</span>
            </div>
            <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-200">
              Editorial Luxury
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
              Clean Glass + Minimal Gold Tag
            </div>
          </button>

          <button
            type="button"
            onClick={() => onApplyCuratedPreset?.("hot_deal")}
            className="p-2.5 rounded-xl border border-red-500/30 bg-red-950/20 text-left hover:border-red-400 hover:scale-102 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">🔥</span>
            </div>
            <div className="text-[11px] font-bold text-red-300 group-hover:text-red-200">
              Hot Deal Promo
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
              High Contrast Red + Solid Card
            </div>
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-slate-800/80" />

      {/* User Custom Saved Presets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold flex items-center text-indigo-400">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            My Custom Saved Presets
          </h3>
          <p className="text-[10px] text-indigo-400/70">Save layout & colors</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-4 border border-slate-800 rounded-xl bg-slate-900/50">
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-400" />
            <span className="text-xs text-slate-400">Loading custom presets...</span>
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
                    title={hasData ? `Apply ${getPresetLabel(key)}` : "Empty Preset"}
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
                    title={`Save current settings to ${getPresetLabel(key)}`}
                  >
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-1" />
                        Save
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
