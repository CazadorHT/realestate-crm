"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Images } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface StudioAlbumPackagerProps {
  imageUrls: string[];
  selectedAlbumIndices: number[];
  onToggleAlbumImage: (idx: number) => void;
  onSelectAllAlbumImages: () => void;
}

export function StudioAlbumPackager({
  imageUrls,
  selectedAlbumIndices,
  onToggleAlbumImage,
  onSelectAllAlbumImages,
}: StudioAlbumPackagerProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const totalCount = (selectedAlbumIndices.length > 0 ? selectedAlbumIndices.length : imageUrls.length) + 1;

  return (
    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Images className="h-3.5 w-3.5 text-amber-400" />
          <span>{isEn ? "Package Album (Cover + Property Photos)" : "จัดชุดภาพโพสต์ (Cover + ภาพจริงลงอัลบั้ม)"}</span>
        </Label>
        <button
          type="button"
          onClick={onSelectAllAlbumImages}
          className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-medium"
        >
          {selectedAlbumIndices.length === imageUrls.length
            ? (isEn ? "Deselect All" : "ล้างการเลือก")
            : (isEn ? `Select All Photos (${imageUrls.length})` : `เลือกภาพจริงทั้งหมด (${imageUrls.length})`)}
        </button>
      </div>

      {/* Slot 1: Cover Banner Indicator */}
      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
            1
          </span>
          <div>
            <p className="text-xs font-bold text-amber-300">
              {isEn ? "⭐ Slide 1: Studio Cover Banner" : "⭐ ภาพที่ 1: ภาพปกแบนเนอร์ (Cover Banner)"}
            </p>
            <p className="text-[10px] text-slate-400">
              {isEn
                ? "Generated poster with title, specs, price tag, and QR code"
                : "ภาพที่สร้างจาก Studio พร้อมพาดหัว สเปก ราคา และ QR Code"}
            </p>
          </div>
        </div>
        <Badge className="bg-amber-500 text-slate-950 text-[9px] font-bold shrink-0">
          {isEn ? "Cover" : "ภาพปก"}
        </Badge>
      </div>

      {/* Slots 2..N: Real Property Photos Thumbnails Grid */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{isEn ? "🖼️ Select property photos to bundle:" : "🖼️ เลือกภาพห้อง/บ้านจริงที่จะโพสต์ต่อจากภาพปก:"}</span>
          <span className="text-[10px] text-amber-400/90 font-bold">
            {isEn ? `Total ${totalCount} photos` : `รวมทั้งชุด ${totalCount} รูป`}
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl bg-slate-900/60 border border-slate-800">
          {imageUrls.map((url, idx) => {
            const isSelected = selectedAlbumIndices.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onToggleAlbumImage(idx)}
                className={`relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer group ${
                  isSelected
                    ? "border-amber-400 ring-1 ring-amber-400 shadow-xs"
                    : "border-slate-800 opacity-40 hover:opacity-75"
                }`}
              >
                <img
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div
                  className={`absolute top-1 left-1 h-4 w-4 rounded flex items-center justify-center text-[9px] font-bold ${
                    isSelected
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-900/80 text-white border border-slate-700"
                  }`}
                >
                  {isSelected ? `✓ ${idx + 2}` : "+"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Facebook Album Layout Tip Card */}
      <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-slate-300 space-y-1">
        <p className="font-bold text-blue-300 flex items-center gap-1.5">
          <span>📘</span>
          <span>{isEn ? "Facebook Album Pro Tips:" : "เทคนิคจัดหน้าปก Facebook Album (4+ รูป):"}</span>
        </p>
        <ul className="text-[10px] text-slate-300 space-y-0.5 pl-4 list-disc marker:text-blue-400">
          <li>
            <strong className="text-amber-300">3:2 (แนวนอน):</strong>{" "}
            {isEn
              ? "Facebook arranges as 1 large top photo + 3 small bottom photos"
              : "Facebook จะแสดงเป็น 1 รูปใหญ่ด้านบน + 3 รูปเล็กเรียงด้านล่าง"}
          </li>
          <li>
            <strong className="text-amber-300">2:3 (แนวตั้ง):</strong>{" "}
            {isEn
              ? "Facebook arranges as 1 large left photo + 3 small right photos"
              : "Facebook จะแสดงเป็น 1 รูปใหญ่ด้านซ้าย + 3 รูปเล็กเรียงด้านขวา"}
          </li>
          <li>
            <strong className="text-amber-300">1:1 (จัตุรัส):</strong>{" "}
            {isEn
              ? "Facebook arranges as 4 equal square grid (2x2)"
              : "Facebook จะแสดงเป็น 4 ช่องจัตุรัสเท่ากัน (กริด 2x2)"}
          </li>
        </ul>
      </div>
    </div>
  );
}

