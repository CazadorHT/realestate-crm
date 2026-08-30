"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Download, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioPresetManagerProps {
  availablePresets: Record<string, any>;
  isLoading: boolean;
  onApplyPreset: (key: string) => void;
  onSavePreset: (key: string) => void;
}

export function StudioPresetManager({
  availablePresets,
  isLoading,
  onApplyPreset,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border border-slate-700/50 rounded-xl bg-slate-800/50 mb-6">
        <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Loading Presets...</span>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 border border-indigo-500/30 bg-indigo-500/10 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center text-indigo-400">
          <Sparkles className="w-4 h-4 mr-1.5 text-indigo-400" />
          My Custom Presets
        </h3>
        <p className="text-xs text-indigo-400/70">Save layout & colors</p>
      </div>

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
    </div>
  );
}
