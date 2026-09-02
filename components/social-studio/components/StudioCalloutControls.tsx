"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, MapPin, Sparkles, Move } from "lucide-react";
import type { CalloutPointer, CalloutPointerStyle, CalloutPointerDirection } from "../types";

interface StudioCalloutControlsProps {
  calloutPointers: CalloutPointer[];
  onAddCallout: (pointer: CalloutPointer) => void;
  onUpdateCallout: (id: string, updates: Partial<CalloutPointer>) => void;
  onRemoveCallout: (id: string) => void;
  isEn?: boolean;
}

const QUICK_CALLOUT_SUGGESTIONS = [
  "🌅 วิวพาโนรามา",
  "👑 เพดานสูง 3 ม.",
  "🛋️ แถมเฟอร์ครบชุด",
  "🍳 ครัวปิดมีบานเลื่อน",
  "🚿 สุขภัณฑ์อัตโนมัติ",
  "🌿 ระเบียงกว้างวิวสวน",
];

export function StudioCalloutControls({
  calloutPointers,
  onAddCallout,
  onUpdateCallout,
  onRemoveCallout,
  isEn = false,
}: StudioCalloutControlsProps) {
  const handleAddNew = () => {
    if (calloutPointers.length >= 4) return;
    const count = calloutPointers.length;
    const defaultPositions = [
      { x: 35, y: 35, dir: "bottom_right" as CalloutPointerDirection },
      { x: 65, y: 30, dir: "bottom_left" as CalloutPointerDirection },
      { x: 50, y: 55, dir: "top_right" as CalloutPointerDirection },
      { x: 25, y: 70, dir: "top_left" as CalloutPointerDirection },
    ];
    const pos = defaultPositions[count] || { x: 50, y: 40, dir: "bottom_right" as CalloutPointerDirection };

    const newPointer: CalloutPointer = {
      id: `callout_${Date.now()}`,
      text: count === 0 ? "👑 เพดานสูง 3 ม." : count === 1 ? "🌅 วิวแม่น้ำสวย" : "🛋️ แต่งครบพร้อมอยู่",
      x: pos.x,
      y: pos.y,
      direction: pos.dir,
      style: "lemon8_yellow",
    };
    onAddCallout(newPointer);
  };

  return (
    <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
            🎯
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              {isEn ? "Feature Callout Pointers" : "สติกเกอร์ลูกศรชี้จุดเด่น"}
              <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 py-0 px-1.5 font-mono">
                Lemon8 Style
              </Badge>
            </h4>
            <p className="text-[10px] text-slate-400">
              {isEn
                ? "Point hand-drawn arrows directly at real highlights in the photo"
                : "ปักหมุดลูกศรชี้จุดเด่นในภาพจริง (เช่น วิวแม่น้ำ, เพดานสูง, ห้องครัว)"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleAddNew}
          disabled={calloutPointers.length >= 4}
          className="h-7 text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="h-3 w-3" />
          <span>{isEn ? "Add Pointer" : "เพิ่มลูกศร"}</span>
        </Button>
      </div>

      {calloutPointers.length === 0 ? (
        <div className="py-4 px-3 rounded-xl border border-dashed border-slate-800 text-center space-y-2 bg-slate-900/30">
          <p className="text-[11px] text-slate-400">
            {isEn ? "No feature pointers yet. Click '+ Add Pointer' to place an arrow." : "ยังไม่มีลูกศรชี้จุดเด่น กดปุ่ม '+ เพิ่มลูกศร' เพื่อชี้จุดขายในรูปภาพ"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {QUICK_CALLOUT_SUGGESTIONS.slice(0, 3).map((sugg) => (
              <button
                key={sugg}
                type="button"
                onClick={() => {
                  onAddCallout({
                    id: `callout_${Date.now()}`,
                    text: sugg,
                    x: 45,
                    y: 35,
                    direction: "bottom_right",
                    style: "lemon8_yellow",
                  });
                }}
                className="text-[10px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                + {sugg}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {calloutPointers.map((pointer, idx) => (
            <div
              key={pointer.id}
              className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2.5 relative group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> จุดที่ {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveCallout(pointer.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                  title="ลบจุดนี้"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Text Input */}
              <div className="space-y-1">
                <Input
                  value={pointer.text}
                  onChange={(e) => onUpdateCallout(pointer.id, { text: e.target.value })}
                  placeholder="ข้อความชี้จุดเด่น เช่น วิวแม่น้ำพาโนรามา"
                  className="h-8 text-xs bg-slate-950 border-slate-700 text-white rounded-lg focus-visible:ring-amber-500"
                />
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1">
                {QUICK_CALLOUT_SUGGESTIONS.map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => onUpdateCallout(pointer.id, { text: sugg })}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {sugg}
                  </button>
                ))}
              </div>

              {/* Direction & Style */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-medium">ทิศทางลูกศร</label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {[
                      { dir: "top_left", icon: "↖️" },
                      { dir: "top_right", icon: "↗️" },
                      { dir: "bottom_left", icon: "↙️" },
                      { dir: "bottom_right", icon: "↘️" },
                    ].map((d) => (
                      <button
                        key={d.dir}
                        type="button"
                        onClick={() => onUpdateCallout(pointer.id, { direction: d.dir as CalloutPointerDirection })}
                        className={`text-xs py-1 rounded text-center transition-all cursor-pointer ${
                          pointer.direction === d.dir
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {d.icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-medium">สไตล์สี</label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    {[
                      { id: "lemon8_yellow", label: "🟡 Lemon8", bg: "#FFE600" },
                      { id: "clean_white", label: "⚪ White", bg: "#FFFFFF" },
                      { id: "neon_glow", label: "⚡ Neon", bg: "#00F2FE" },
                      { id: "dark_luxury", label: "👑 Gold", bg: "#F59E0B" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onUpdateCallout(pointer.id, { style: st.id as CalloutPointerStyle })}
                        className={`h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
                          pointer.style === st.id ? "ring-2 ring-amber-400 scale-105" : "opacity-60 hover:opacity-100"
                        }`}
                        title={st.label}
                      >
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: st.bg }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Font Size & Arrow Scale Controls */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                {/* Font Size */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-medium">
                    <span>{isEn ? "Font Size" : "ขนาดฟอนต์"}</span>
                    <span className="font-mono text-amber-400">{pointer.fontSize || 22}px</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1.5">
                    {[
                      { label: "S", size: 18 },
                      { label: "M", size: 22 },
                      { label: "L", size: 28 },
                      { label: "XL", size: 34 },
                    ].map((sz) => (
                      <button
                        key={sz.label}
                        type="button"
                        onClick={() => onUpdateCallout(pointer.id, { fontSize: sz.size })}
                        className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          (pointer.fontSize || 22) === sz.size
                            ? "bg-amber-500/25 border border-amber-500/50 text-amber-300"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="38"
                    value={pointer.fontSize || 22}
                    onChange={(e) => onUpdateCallout(pointer.id, { fontSize: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Arrow Scale / Length */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-medium">
                    <span>{isEn ? "Arrow Size / Length" : "ขนาด/ความยาวลูกศร"}</span>
                    <span className="font-mono text-amber-400">{(pointer.arrowScale || 1.0).toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1.5">
                    {[
                      { label: isEn ? "Short" : "สั้น", scale: 0.7 },
                      { label: isEn ? "Normal" : "ปกติ", scale: 1.0 },
                      { label: isEn ? "Long" : "ยาว", scale: 1.4 },
                    ].map((sc) => (
                      <button
                        key={sc.label}
                        type="button"
                        onClick={() => onUpdateCallout(pointer.id, { arrowScale: sc.scale })}
                        className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          Math.abs((pointer.arrowScale || 1.0) - sc.scale) < 0.1
                            ? "bg-amber-500/25 border border-amber-500/50 text-amber-300"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="18"
                    value={Math.round((pointer.arrowScale || 1.0) * 10)}
                    onChange={(e) => onUpdateCallout(pointer.id, { arrowScale: parseInt(e.target.value, 10) / 10 })}
                    className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Coordinate Sliders (X & Y) with Drag Hint */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>ตำแหน่ง X</span>
                    <span className="font-mono text-amber-400">{pointer.x}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={pointer.x}
                    onChange={(e) => onUpdateCallout(pointer.id, { x: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>ตำแหน่ง Y</span>
                    <span className="font-mono text-amber-400">{pointer.y}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={pointer.y}
                    onChange={(e) => onUpdateCallout(pointer.id, { y: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <Move className="h-2.5 w-2.5 text-amber-400" />
                  หรือใช้เมาส์คลิกลากจุดหมุดบนภาพพรีวิวได้โดยตรง
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
