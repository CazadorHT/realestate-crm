"use client";

import Image from "next/image";

interface LinePreviewProps {
  images: string[];
  previewData: any;
  lang: string;
}

export function LinePreview({ images, previewData, lang }: LinePreviewProps) {
  if (!previewData) return null;

  return (
    <div className="bg-[#EBEEF5] p-4 rounded-2xl border border-slate-200 shadow-inner">
      <div className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-slate-100 max-w-[320px] mx-auto">
        {/* Flex Body */}
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <div className="text-[17px] font-bold text-[#1E3A5F] leading-tight line-clamp-2">
              {previewData.title}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {previewData.propertyType}
              ,{previewData.listingType_label}
            </div>
          </div>
          {/* Flex Image Grid */}
          <div className="grid grid-cols-2 gap-1 bg-slate-200 h-[180px]">
            {images.slice(0, 4).map((img, i) => (
              <div key={i} className="relative w-full h-full bg-slate-100">
                <Image src={img} alt="preview" fill className="object-cover" />
              </div>
            ))}
          </div>
          <div className="space-y-0.5">
            <div className="text-xl font-bold text-[#E53935] whitespace-pre-wrap leading-tight">
              {previewData.priceDisplay}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs">📍</span>
              <span className="text-[11px] text-slate-500 line-clamp-1">
                {previewData.location}
              </span>
            </div>
          </div>

          {/* Specs Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <div className="flex flex-col items-center flex-1">
              <span className="text-sm">🛌</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {previewData.bedrooms || "-"}
                {lang === "th" ? "นอน" : "Bed"}
              </span>
            </div>
            <div className="flex flex-col items-center flex-1 border-x border-slate-50">
              <span className="text-sm">🚿</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {previewData.bathrooms || "-"}
                {lang === "th" ? "น้ำ" : "Bath"}
              </span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[10px] font-bold text-slate-700">
                {previewData.size_sqm || "-"}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {lang === "th" ? "ตร.ม." : "sq.m."}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-50" />
        </div>

        {/* Flex Footer */}
        <div className="p-3 pt-0 space-y-2">
          <div className="w-full h-9 bg-[#F5F5F5] rounded-lg flex items-center justify-center border border-slate-100 italic text-[11px] font-bold text-slate-400">
            {lang === "th" ? "ดูรายละเอียดเพิ่มเติม" : "View Details"}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-9 bg-[#F5F5F5] rounded-lg flex items-center justify-center border border-slate-100 italic text-[10px] font-medium text-slate-400">
              {lang === "th" ? "สนใจ" : "Interested"}
            </div>
            <div className="h-9 bg-[#F5F5F5] rounded-lg flex items-center justify-center border border-slate-100 italic text-[10px] font-medium text-slate-400">
              {lang === "th" ? "ติดต่อเจ้าหน้าที่" : "Contact Agent"}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
