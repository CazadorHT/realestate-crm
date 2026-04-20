"use client";

import { Sparkles, X, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiInsightRibbonProps {
  insight: string;
  onClear: () => void;
}

/**
 * 🛰️ [Elite] AI Insight Ribbon
 * Displays the reasoning behind the agentic search intent.
 */
export function AiInsightRibbon({ insight, onClear }: AiInsightRibbonProps) {
  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-600/5 via-purple-600/5 to-pink-600/5 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-xs">
        {/* Decorative Background Icon */}
        <BrainCircuit className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/5 -rotate-12" />
        
        <div className="shrink-0 mt-1">
          <div className="bg-linear-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="grow space-y-1 relative">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
            AI Scout Insight
          </h4>
          <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed">
            "{insight}"
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="shrink-0 h-8 w-8 rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-all"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
