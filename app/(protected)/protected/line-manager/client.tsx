"use client";

import { useState } from "react";
import { LineTemplate } from "@/features/line/types";
import { updateLineTemplate } from "@/features/line/actions";
import {
  Home,
  MessageCircle,
  Mail,
  UserPlus,
  LogIn,
  TrendingDown,
  CheckCircle,
  Tag,
  Palette,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Premium Color Presets (Dominant Color + Gradient Class for UI)
const COLOR_PRESETS = [
  { name: "Ocean", color: "#0288D1", gradient: "from-cyan-500 to-blue-600" },
  {
    name: "Emerald",
    color: "#2E7D32",
    gradient: "from-emerald-500 to-green-600",
  },
  { name: "Sunset", color: "#E64A19", gradient: "from-orange-500 to-red-600" },
  {
    name: "Royal",
    color: "#7B1FA2",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    name: "Graphite",
    color: "#37474F",
    gradient: "from-slate-600 to-slate-800",
  },
  { name: "Gold", color: "#FBC02D", gradient: "from-yellow-400 to-amber-600" },
];

export function LineManagerClient({
  initialTemplates,
}: {
  initialTemplates: LineTemplate[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [loading, setLoading] = useState<string | null>(null);

  const getIcon = (key: string) => {
    const className = "w-5 h-5 text-white";
    switch (key) {
      case "DEPOSIT":
        return <Home className={className} />;
      case "INQUIRY":
        return <MessageCircle className={className} />;
      case "CONTACT":
        return <Mail className={className} />;
      case "SIGNUP":
        return <UserPlus className={className} />;
      case "LOGIN":
        return <LogIn className={className} />;
      case "PRICE_DROP":
        return <TrendingDown className={className} />;
      case "DEAL_SOLO":
        return <CheckCircle className={className} />;
      case "DEAL_RENT":
        return <Tag className={className} />;
      default:
        return <MessageCircle className={className} />;
    }
  };

  const handleUpdate = async (key: string, field: string, value: any) => {
    // Optimistic Update
    const updatedTemplates = templates.map((t) => {
      if (t.key === key) {
        if (field === "is_active") return { ...t, is_active: value };
        if (field === "config.headerColor")
          return { ...t, config: { ...t.config, headerColor: value } };
        if (field === "config.headerText")
          return { ...t, config: { ...t.config, headerText: value } };
      }
      return t;
    });
    setTemplates(updatedTemplates);

    // If it's just text input, don't auto-save immediately to avoid spamming (debounce ideally, but explicit save for now is safer or just background save)
    // For Toggles/Colors, likely safe to save immediately
    if (field === "is_active" || field === "config.headerColor") {
      saveChanges(key, updatedTemplates);
    }
  };

  const saveChanges = async (key: string, currentTemplates: LineTemplate[]) => {
    const template = currentTemplates.find((t) => t.key === key);
    if (!template) return;

    setLoading(key);
    try {
      await updateLineTemplate(key, {
        is_active: template.is_active,
        config: template.config,
      });
      toast.success("Saved changes");
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setLoading(null);
    }
  };

  const handleManualSave = (key: string) => {
    saveChanges(key, templates);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight bg-linear-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          LINE Notification Manager
        </h2>
        <p className="text-muted-foreground">
          Customize your LINE Flex Message templates and visibility.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
        {templates.map((template) => {
          // Find matching gradient for UI (fallback to solid based on hex match or default)
          const preset = COLOR_PRESETS.find(
            (p) =>
              p.color.toLowerCase() ===
              template.config.headerColor?.toLowerCase(),
          );
          const gradientClass =
            preset?.gradient || "from-slate-500 to-slate-700";

          return (
            <div
              key={template.key}
              className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300"
            >
              {/* Gradient Header Strip */}
              <div className={cn("h-2 w-full bg-linear-to-r", gradientClass)} />

              <div className="p-6">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg bg-linear-to-br shadow-inner text-white",
                        gradientClass,
                      )}
                    >
                      {getIcon(template.key)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {template.label}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono opacity-80">
                        {template.key}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={template.is_active}
                        onChange={(e) =>
                          handleUpdate(
                            template.key,
                            "is_active",
                            e.target.checked,
                          )
                        }
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Header Text
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        value={template.config.headerText}
                        onChange={(e) =>
                          handleUpdate(
                            template.key,
                            "config.headerText",
                            e.target.value,
                          )
                        }
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleManualSave(template.key)}
                        disabled={loading === template.key}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        {loading === template.key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Theme Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          onClick={() =>
                            handleUpdate(
                              template.key,
                              "config.headerColor",
                              p.color,
                            )
                          }
                          className={cn(
                            "w-8 h-8 rounded-full transition-all hover:scale-110 focus:ring-2 focus:ring-offset-2 ring-blue-500",
                            template.config.headerColor === p.color
                              ? "ring-2 ring-offset-2 scale-110 shadow-md"
                              : "opacity-80 hover:opacity-100",
                          )}
                          style={{ backgroundColor: p.color }}
                          title={p.name}
                        />
                      ))}
                      {/* Custom color picker fallback */}
                      <div className="relative group">
                        <input
                          type="color"
                          className="w-8 h-8 rounded-full p-0 border-0 overflow-hidden cursor-pointer opacity-0 absolute inset-0"
                          value={template.config.headerColor}
                          onChange={(e) =>
                            handleUpdate(
                              template.key,
                              "config.headerColor",
                              e.target.value,
                            )
                          }
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
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">
                      Flex Message Preview
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal text-slate-400"
                    >
                      Mobile
                    </Badge>
                  </div>

                  <div className="relative mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-white max-w-[280px]">
                    {/* Flex Header */}
                    <div
                      style={{ backgroundColor: template.config.headerColor }}
                      className="p-4 flex items-center gap-3 relative overflow-hidden"
                    >
                      {/* Add simulated gradient overlay for preview only */}
                      <div className="absolute inset-0 bg-white/10" />

                      <div className="relative z-10 flex items-center gap-2">
                        <div className="opacity-90">
                          {getIcon(template.key)}
                        </div>
                        <span className="text-white font-bold text-sm tracking-wide text-shadow-sm">
                          {template.config.headerText}
                        </span>
                      </div>
                    </div>

                    {/* Flex Body Mock */}
                    <div className="bg-white">
                      <div className="h-32 bg-gray-300 w-full object-cover relative">
                        <img
                          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500&q=60"
                          alt="Property"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded text-xs font-bold text-gray-700">
                          FOR SALE
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-50 rounded w-1/2" />
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-5 bg-red-50 rounded w-1/3" />
                          <div className="h-6 w-20 bg-slate-800 rounded text-center text-[10px] text-white leading-6 px-2">
                            Button
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Loader2 className="w-10 h-10 mb-4 animate-spin text-slate-300" />
          <p className="font-medium">Loading templates...</p>
        </div>
      )}
    </div>
  );
}
