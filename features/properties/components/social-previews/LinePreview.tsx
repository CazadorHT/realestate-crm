import Image from "next/image";
import { type Language } from "@/lib/i18n";

interface LinePreviewProps {
  images: string[];
  previewData: any;
  lang: Language;
}

export function LinePreview({ images, previewData, lang }: LinePreviewProps) {
  if (!previewData) return null;

  return (
    <div className="bg-[#EBEEF5] p-4 rounded-2xl border border-slate-200 shadow-inner">
      <div className="bg-white rounded-[20px] overflow-hidden shadow-sm border border-slate-100 max-w-[280px] xs:max-w-[320px] sm:max-w-[360px] mx-auto">
        {/* Header (Exact Match) */}
        <div className="px-5 pt-5 pb-0 space-y-0.5">
          <div className="text-[17px] font-bold text-[#1E3A5F] leading-tight line-clamp-2">
            🔥 {previewData.title}
          </div>
          <div className="text-[11px] text-[#888888] font-medium">
            {previewData.propertyType} | {previewData.listingType_label}
          </div>
        </div>

        {/* Body (Exact Match) */}
        <div className="p-0">
          {/* Photos Box */}
          <div className="p-5 pb-0">
            <div className="grid grid-cols-2 gap-1 bg-slate-200 h-[180px] rounded-sm overflow-hidden">
              {images.slice(0, 4).map((img, i) => (
                <div key={i} className="relative w-full h-full bg-slate-100">
                  <Image src={img} alt="preview" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-5 space-y-1.5">
            <div className="text-[18px] font-bold text-[#E53935] whitespace-pre-wrap leading-tight">
              {previewData.priceDisplay}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px]">📍</span>
              <span className="text-[12px] text-[#666666] line-clamp-1">
                {previewData.location}
              </span>
            </div>

            {/* Specs Row */}
            <div className="flex items-center justify-between pt-3">
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm">🛌</span>
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                  {previewData.bedrooms || "-"}
                  {lang === "th" ? "นอน" : lang === "cn" ? "卧室" : lang === "ru" ? "спальняняня" : "Bed"}
                </span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-sm">🚿</span>
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                  {previewData.bathrooms || "-"}
                  {lang === "th" ? "น้ำ" : lang === "cn" ? "浴室" : lang === "ru" ? "ванн" : "Bath"}
                </span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[10px] font-bold text-slate-700">
                  {previewData.size_sqm || "-"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                  {lang === "th" ? "ตร.ม." : lang === "cn" ? "平方米" : lang === "ru" ? "кв.м." : "sq.m."}
                </span>
              </div>
            </div>
          </div>

          {/* Template Content Box (Dynamic) */}
          {previewData.content && (
            <div className="px-5 pb-5 pt-0">
              <div className="pt-3 border-t border-slate-100" />
              <div className="text-[12px] text-[#333333] whitespace-pre-wrap leading-relaxed">
                {previewData.content}
              </div>
            </div>
          )}
        </div>

        {/* Footer (Exact Match) */}
        <div className="p-4 pt-0 space-y-2">
          <div className="w-full h-10 bg-[#1E3A5F] rounded-md flex items-center justify-center text-[12px] font-bold text-white">
            {lang === "th" ? "🌐 ดูรายละเอียดเพิ่มเติม" : (lang === "cn" ? "🌐 查看更多" : (lang === "ru" ? "🌐 Подробнее" : "🌐 View Details"))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 bg-[#F5F5F5] rounded-md flex items-center justify-center text-[11px] font-medium text-[#666666]">
              {lang === "th" ? "❤️ สนใจ" : (lang === "cn" ? "❤️ 感兴趣" : (lang === "ru" ? "❤️ Интересует" : "❤️ Interested"))}
            </div>
            <div className="h-10 bg-[#F5F5F5] rounded-md flex items-center justify-center text-[11px] font-medium text-[#666666]">
              {lang === "th" ? "💬 ติดต่อเจ้าหน้าที่" : (lang === "cn" ? "💬 联系中介" : (lang === "ru" ? "💬 Связаться" : "💬 Contact Agent"))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
