"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Search, 
  BrainCircuit, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { triggerPropertyAiReviewAction } from "@/features/properties/actions/update";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdminAiTriggersProps {
  propertyId: string;
  hasSummary: boolean;
  hasEmbedding: boolean;
  requiresReview: boolean;
  isFeatured?: boolean;
}

/**
 * ⚡ [Elite] Zero-Cost AI Automation Controls
 * Provides manual on-demand AI analysis and embedding generation.
 */
export function AdminAiTriggers({
  propertyId,
  hasSummary,
  hasEmbedding,
  requiresReview,
  isFeatured = false
}: AdminAiTriggersProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleTrigger = async () => {
    setIsLoading(true);
    try {
      const result = await triggerPropertyAiReviewAction(propertyId);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to start AI review");
    } finally {
      setIsLoading(false);
    }
  };

  const isReadyForSearch = hasSummary && hasEmbedding;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <BrainCircuit className="w-3.5 h-3.5" />
          AI & Logic Intelligence
        </h3>
        {isFeatured && (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[10px]">
            Featured
          </Badge>
        )}
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-2">
            <Search className="w-4 h-4" /> FTS Content
          </span>
          {hasSummary ? (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1 text-[10px]">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-400 border-slate-200 gap-1 text-[10px]">
              Missing
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Vector Embedding
          </span>
          {hasEmbedding ? (
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1 text-[10px]">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-400 border-slate-200 gap-1 text-[10px]">
              Missing
            </Badge>
          )}
        </div>
      </div>

      {!isReadyForSearch && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-700 leading-relaxed">
            ทรัพย์นี้จะยังไม่ปรากฏใน <strong>Keyword Search</strong> และ <strong>Smart Match</strong> จนกว่าจะมีการสร้าง AI Metadata ครับ
          </p>
        </div>
      )}

      <Button
        onClick={handleTrigger}
        disabled={isLoading}
        className={`w-full rounded-xl gap-2 font-bold transition-all ${
          isLoading ? "bg-slate-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            กำลังประมวลผล...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {isReadyForSearch ? "Refresh AI Context" : "⚡ Boost with AI"}
          </>
        )}
      </Button>
    </div>
  );
}
