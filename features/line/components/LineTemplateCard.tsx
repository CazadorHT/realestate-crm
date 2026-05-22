"use client";

import React from "react";
import Image from "next/image";
import { 
  Home, MessageCircle, Mail, UserPlus, LogIn, 
  TrendingDown, CheckCircle, Tag, Palette, Loader2, Save, User, Clock, ExternalLink 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineTemplate } from "../types";

// Premium Color Presets
export const COLOR_PRESETS = [
  { name: "Ocean", color: "#0288D1", gradient: "from-cyan-500 to-blue-600" },
  { name: "Emerald", color: "#2E7D32", gradient: "from-emerald-500 to-green-600" },
  { name: "Sunset", color: "#E64A19", gradient: "from-orange-500 to-red-600" },
  { name: "Royal", color: "#7B1FA2", gradient: "from-purple-500 to-indigo-600" },
  { name: "Graphite", color: "#37474F", gradient: "from-slate-600 to-slate-800" },
  { name: "Gold", color: "#FBC02D", gradient: "from-yellow-400 to-amber-600" },
];

export const getLineIcon = (key: string, className = "w-5 h-5 text-white") => {
  switch (key) {
    case "DEPOSIT": return <Home className={className} />;
    case "INQUIRY": return <MessageCircle className={className} />;
    case "CONTACT": return <Mail className={className} />;
    case "SIGNUP": return <UserPlus className={className} />;
    case "LOGIN": return <LogIn className={className} />;
    case "PRICE_DROP": return <TrendingDown className={className} />;
    case "DEAL_SOLO": return <CheckCircle className={className} />;
    case "DEAL_RENT": return <Tag className={className} />;
    default: return <MessageCircle className={className} />;
  }
};

interface LineTemplateCardProps {
  template: LineTemplate;
  loading: boolean;
  onUpdate: (key: string, field: any, value: any) => void;
  onSave: (key: string) => void;
}

export function LineTemplateCard({
  template,
  loading,
  onUpdate,
  onSave,
}: LineTemplateCardProps) {
  const preset = COLOR_PRESETS.find(
    (p) => p.color.toLowerCase() === template.config.headerColor?.toLowerCase()
  );
  const gradientClass = preset?.gradient || "from-slate-500 to-slate-700";

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Gradient Header Strip */}
      <div className={cn("h-2 w-full bg-linear-to-r", gradientClass)} />

      <div className="p-6">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-lg bg-linear-to-br shadow-inner text-white",
                gradientClass
              )}
            >
              {getLineIcon(template.key)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{template.label}</h3>
              <p className="text-xs text-slate-500 font-mono opacity-80">{template.key}</p>
            </div>
          </div>

          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={template.is_active}
                onChange={(e) => onUpdate(template.key, "is_active", e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Header Text
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={template.config.headerText}
                onChange={(e) => onUpdate(template.key, "config.headerText", e.target.value)}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onSave(template.key)}
                disabled={loading}
                className="text-slate-400 hover:text-blue-600"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Palette className="w-3 h-3" /> Theme Color
            </span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => onUpdate(template.key, "config.headerColor", p.color)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all hover:scale-110 focus:ring-2 focus:ring-offset-2 ring-blue-500",
                    template.config.headerColor === p.color
                      ? "ring-2 ring-offset-2 scale-110 shadow-md"
                      : "opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                />
              ))}
              <div className="relative group">
                <input
                  type="color"
                  className="w-8 h-8 rounded-full p-0 border-0 overflow-hidden cursor-pointer opacity-0 absolute inset-0"
                  value={template.config.headerColor}
                  onChange={(e) => onUpdate(template.key, "config.headerColor", e.target.value)}
                />
                <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-white text-slate-400 hover:text-slate-600 pointer-events-none">
                  <span className="text-xs font-bold">+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex flex-col items-center justify-between mb-3">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-medium text-slate-400">Flex Message Preview</span>
              <Badge variant="outline" className="text-[10px] font-normal text-slate-400">Mobile</Badge>
            </div>
          </div>

          <div className="relative mx-auto rounded-3xl p-3 bg-[#7488ab] shadow-inner max-w-[280px]">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-600/30 rounded-full" />
            <div className="mt-4 flex gap-2">
                 <div className="relative h-8 w-8 rounded-full shrink-0 shadow-sm overflow-hidden border border-white/20">
                  <Image
                    src={`https://ui-avatars.com/api/?name=${template.key}&background=random`}
                    alt={`Avatar for ${template.label}`}
                    className="w-full h-full opacity-80"
                    fill
                    sizes="32px"
                    unoptimized
                  />
               </div>
               <div className="flex flex-col gap-1 max-w-[200px]">
                  <span className="text-[10px] text-white/70 font-bold ml-1">OA Service</span>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
                    <div style={{ backgroundColor: template.config.headerColor }} className="p-3.5 flex items-center gap-2.5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-linear-to-b from-white/10 to-black/10" />
                      <div className="relative z-10 flex items-center gap-2">
                        <div className="opacity-90 scale-90">{getLineIcon(template.key)}</div>
                        <span className="text-white font-bold text-[13px] tracking-tight leading-tight">{template.config.headerText}</span>
                      </div>
                    </div>

                    {["LOGIN", "SIGNUP", "CONTACT"].includes(template.key) ? (
                      <div className="p-4 bg-white space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="h-3 w-2/3 bg-slate-100 rounded" />
                            <div className="h-2 w-1/3 bg-slate-50 rounded" />
                          </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" /> 
                            <span>{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                          </div>
                        </div>
                        <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 rounded-xl text-white text-xs font-bold shadow-md hover:bg-slate-800 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" /> ตรวจสอบสถานะ
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white">
                        <div className="h-32 bg-slate-200 w-full object-cover relative group">
                          <Image
                            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&q=60"
                            alt="Property"
                            className="w-full h-full object-cover"
                            fill
                            sizes="256px"
                            unoptimized
                          />
                          <div className="absolute top-2 right-2 bg-white/95 px-2 py-0.5 rounded-lg text-[9px] font-bold text-slate-800 shadow-sm border border-slate-100">
                            {template.key === "DEAL_SOLO" ? "🎉 SOLD OUT" : template.key === "DEAL_RENT" ? "📝 RENTED" : "FOR SALE"}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="space-y-1.5"><div className="h-3 bg-slate-100 rounded w-full" /><div className="h-2.5 bg-slate-50 rounded w-3/4" /></div>
                          <div className="flex justify-between items-end pt-2 border-t border-slate-50">
                            <div className="space-y-1"><div className="h-2 w-12 bg-slate-50 rounded" /><div className="h-5 bg-red-50 rounded w-20 border border-red-100" /></div>
                            <div className="h-8 w-24 bg-slate-900 hover:bg-slate-800 rounded-xl text-center text-[11px] text-white font-bold leading-8 px-3 shadow-md transition-all">ดูรายละเอียด</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
