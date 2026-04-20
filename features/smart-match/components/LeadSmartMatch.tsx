"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";
import { runSmartMatchAction } from "../actions";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface LeadSmartMatchProps {
  leadId: string;
  leadName: string;
  initialSummary?: string;
}

export function LeadSmartMatch({ leadId, leadName, initialSummary }: LeadSmartMatchProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [summary, setSummary] = useState(initialSummary || "");
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    try {
      const res = await runSmartMatchAction(leadId, true); // true = notify agent if high match
      if (res.success) {
        setMatches(res.matches || []);
        if (res.requirementSummary) setSummary(res.requirementSummary);
        setHasScanned(true);
      } else {
        alert("Matching failed: " + res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transition-all duration-500">
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <Sparkles className={cn("h-6 w-6", loading && "animate-pulse")} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">AI Smart Match</h3>
              <p className="text-sm text-slate-500 font-medium italic">Precision matching via Google Gemini</p>
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={loading}
            className="inline-flex  items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-slate-900/10"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Scan for Matches
              </>
            )}
          </button>
        </div>

        {/* AI Insight Summary */}
        {summary && (
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
            <div className="text-[10px] uppercase tracking-widest font-bold text-indigo-500 mb-1">Lead Requirement Vector</div>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">
              {summary}
            </p>
          </div>
        )}

        {/* Results Area */}
        {!hasScanned && !loading && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <Sparkles className="h-8 w-8" />
            </div>
            <p className="text-slate-400 text-sm font-medium max-w-xs">
              Click Scan to analyze the database and find the best properties for {leadName}.
            </p>
          </div>
        )}

        {hasScanned && matches.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-500 font-medium">No high-confidence matches found right now.</p>
          </div>
        )}

        {matches.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((property, idx) => (
              <div 
                key={property.id} 
                className="group relative p-5 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300"
              >
                {/* Match Score Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">
                  <CheckCircle2 className="h-3 w-3" />
                  {Math.round(property.similarity * 100)}% Match
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      {property.property_type.replace(/_/g, ' ')}
                    </p>
                    <h4 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {property.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-slate-900">
                      {property.listing_type === 'RENT' 
                        ? `${property.rental_price?.toLocaleString()} ฿/mo`
                        : `${property.price?.toLocaleString()} ฿`
                      }
                    </div>
                  </div>

                  <Link 
                    href={`/protected/properties/${property.id}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-900 hover:text-white transition-all"
                  >
                    View Details
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LINE Hint */}
        {hasScanned && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
             <Send className="h-4 w-4 text-emerald-500" />
             <p className="text-[11px] text-emerald-700 font-medium">
               High-confidence matches ({'>'}85%) have been notified to the assigned agent on LINE.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
