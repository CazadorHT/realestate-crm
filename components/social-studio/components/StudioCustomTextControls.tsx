import React from "react";
import { Type, Plus, Trash2, Move, Sparkles } from "lucide-react";
import type { CustomTextItem, StudioLanguage } from "../types";

interface StudioCustomTextControlsProps {
  language: StudioLanguage;
  customTexts: CustomTextItem[];
  onAddCustomText: (item: CustomTextItem) => void;
  onUpdateCustomText: (id: string, updates: Partial<CustomTextItem>) => void;
  onRemoveCustomText: (id: string) => void;
}

const QUICK_TEXT_PRESETS = [
  { text: "★ จองวันนี้ ฟรีค่าโอน ★", color: "#FDE68A", bg: "#0F172A", border: "#F59E0B" },
  { text: "🔥 ลดด่วน 500,000 บาท", color: "#FFFFFF", bg: "#EF4444", border: "#FFFFFF" },
  { text: "✨ แต่งครบ พร้อมเข้าอยู่", color: "#1E293B", bg: "#FFFFFF", border: "#CBD5E1" },
  { text: "🐾 Pet-Friendly เลี้ยงสัตว์ได้", color: "#FFFFFF", bg: "#059669", border: "#A7F3D0" },
  { text: "👑 ห้องมุม วิวแม่น้ำ ชั้นสูง", color: "#FDE68A", bg: "#0A192F", border: "#D4AF37" },
];

export const StudioCustomTextControls: React.FC<StudioCustomTextControlsProps> = ({
  language,
  customTexts,
  onAddCustomText,
  onUpdateCustomText,
  onRemoveCustomText,
}) => {
  const isEn = language === "en";

  const handleAddNew = (preset?: typeof QUICK_TEXT_PRESETS[0]) => {
    const newId = `custom-text-${Date.now()}`;
    const defaultY = Math.min(85, 25 + customTexts.length * 14);
    const item: CustomTextItem = {
      id: newId,
      text: preset ? preset.text : isEn ? "Special Offer" : "ข้อความพิเศษ",
      x: 50,
      y: defaultY,
      fontSize: 30,
      textColor: preset ? preset.color : "#FFFFFF",
      bgColor: preset ? preset.bg : "rgba(15, 23, 42, 0.88)",
      borderColor: preset ? preset.border : "#F59E0B",
      borderWidth: 1.5,
      borderRadius: 14,
      isBold: true,
    };
    onAddCustomText(item);
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Type className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            {isEn ? "Additional Custom Texts" : "ข้อความ / สติกเกอร์เพิ่มเติม"}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full font-mono">
            {customTexts.length}/6
          </span>
        </div>

        {customTexts.length < 6 && (
          <button
            type="button"
            onClick={() => handleAddNew()}
            className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>{isEn ? "Add Text" : "เพิ่มข้อความ"}</span>
          </button>
        )}
      </div>

      {/* Quick Suggestions when empty */}
      {customTexts.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-2">
          <p className="text-[11px] text-slate-400">
            {isEn
              ? "Add custom text stickers or promotion tags anywhere on the banner."
              : "ยังไม่มีข้อความเพิ่มเติม คลิกเพิ่มข้อความอิสระ หรือเลือกแม่แบบด่วนด้านล่าง"}
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center pt-1">
            {QUICK_TEXT_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddNew(p)}
                className="text-[10px] px-2 py-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:border-emerald-500/60 hover:text-emerald-300 text-slate-300 transition-all cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                {p.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Text Items List */}
      <div className="space-y-3">
        {customTexts.map((item, idx) => (
          <div
            key={item.id}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow-sm"
          >
            {/* Item Title & Delete */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono text-emerald-400">
                  {idx + 1}
                </span>
                {isEn ? `Text Badge #${idx + 1}` : `ข้อความที่ ${idx + 1}`}
              </span>

              <button
                type="button"
                onClick={() => onRemoveCustomText(item.id)}
                className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer p-1"
                title={isEn ? "Remove" : "ลบข้อความนี้"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Text Input */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1 font-medium">
                {isEn ? "Text Content (supports multi-line)" : "เนื้อหาข้อความ (ขึ้นบรรทัดใหม่ได้)"}
              </label>
              <textarea
                rows={2}
                value={item.text}
                onChange={(e) => onUpdateCustomText(item.id, { text: e.target.value })}
                placeholder={isEn ? "Enter text..." : "พิมพ์ข้อความ..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none font-medium"
              />
            </div>

            {/* Font Size & Styling Controls */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {/* Font Size */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-medium">
                  <span>{isEn ? "Font Size" : "ขนาดฟอนต์"}</span>
                  <span className="font-mono text-emerald-400">{item.fontSize || 30}px</span>
                </div>
                <div className="flex items-center gap-1 mb-1.5">
                  {[
                    { label: "S", size: 22 },
                    { label: "M", size: 30 },
                    { label: "L", size: 40 },
                    { label: "XL", size: 50 },
                  ].map((sz) => (
                    <button
                      key={sz.label}
                      type="button"
                      onClick={() => onUpdateCustomText(item.id, { fontSize: sz.size })}
                      className={`flex-1 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                        (item.fontSize || 30) === sz.size
                          ? "bg-emerald-500/25 border border-emerald-500/50 text-emerald-300"
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="18"
                  max="60"
                  value={item.fontSize || 30}
                  onChange={(e) => onUpdateCustomText(item.id, { fontSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Color Styles Preset */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">
                  {isEn ? "Color Theme" : "ชุดสีป้าย"}
                </label>
                <div className="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {[
                    { text: "#FFFFFF", bg: "#0F172A", border: "#F59E0B", title: "Dark Gold" },
                    { text: "#1E293B", bg: "#FFFFFF", border: "#CBD5E1", title: "Clean White" },
                    { text: "#000000", bg: "#FFE600", border: "#000000", title: "Yellow Pop" },
                    { text: "#FFFFFF", bg: "#EF4444", border: "#FFFFFF", title: "Red Sale" },
                    { text: "#FFFFFF", bg: "transparent", border: "transparent", title: "Transparent" },
                  ].map((theme, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() =>
                        onUpdateCustomText(item.id, {
                          textColor: theme.text,
                          bgColor: theme.bg,
                          borderColor: theme.border,
                          borderWidth: theme.border === "transparent" ? 0 : 1.5,
                        })
                      }
                      className="h-6 rounded flex items-center justify-center transition-all cursor-pointer hover:scale-105 border border-slate-800"
                      title={theme.title}
                      style={{ backgroundColor: theme.bg === "transparent" ? "#334155" : theme.bg }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.text }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Coordinate Sliders (X & Y) with Drag Hint */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>ตำแหน่ง X</span>
                  <span className="font-mono text-emerald-400">{item.x}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={item.x}
                  onChange={(e) => onUpdateCustomText(item.id, { x: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>ตำแหน่ง Y</span>
                  <span className="font-mono text-emerald-400">{item.y}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={item.y}
                  onChange={(e) => onUpdateCustomText(item.id, { y: parseInt(e.target.value, 10) })}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <Move className="h-2.5 w-2.5 text-emerald-400" />
                หรือใช้เมาส์คลิกลากป้ายข้อความบนภาพพรีวิวได้โดยตรง
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
