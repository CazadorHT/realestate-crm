"use client";

import { 
  Bot, 
  FileText, 
  Sparkles, 
  PenTool, 
  ClipboardList, 
  MapPin 
} from "lucide-react";

export function StatusBadge({ status }: { status: "success" | "error" }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-700 border border-emerald-200/50 shadow-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Success
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100/80 text-red-700 border border-red-200/50 shadow-xs">
      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Error
    </span>
  );
}

export function FeatureBadge({ feature }: { feature: string }) {
  if (feature === "chatbot") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
        <Bot className="w-3.5 h-3.5" /> Chatbot
      </span>
    );
  }
  if (feature === "blog_generator" || feature === "content_refiner") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-100">
        <FileText className="w-3.5 h-3.5" /> Content AI
      </span>
    );
  }
  if (
    feature === "description_generator" ||
    feature === "property_translator"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
        <PenTool className="w-3.5 h-3.5" /> Property AI
      </span>
    );
  }
  if (feature === "lead_summary") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <ClipboardList className="w-3.5 h-3.5" /> Lead AI
      </span>
    );
  }
  if (feature === "popular_areas_translator") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
        <MapPin className="w-3.5 h-3.5" /> Area AI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 uppercase">
      <Sparkles className="w-3.5 h-3.5" /> {feature}
    </span>
  );
}
