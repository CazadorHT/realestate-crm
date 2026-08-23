import { Sparkles, ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMockPropertyData } from "./constants";
import { type Language } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/language-context";

export function TikTokPostPreview({
  template,
  language: propLang,
}: {
  template: string;
  language?: Language;
}) {
  const { language: ctxLang } = useLanguage();
  const activeLang = propLang || ctxLang;
  const isEn = activeLang === "en";
  const mockData = getMockPropertyData(isEn);

  const renderContent = (text: string) => {
    if (!text)
      return (
        <span className="text-slate-300 italic">
          {isEn ? "Please enter a message template to preview..." : "กรุณากรอกรูปแบบข้อความเพื่อดูตัวอย่าง..."}
        </span>
      );

    let rendered = text;
    Object.entries(mockData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(regex, value || "");
    });

    return rendered;
  };

  return (
    <div className="bg-black border rounded-[32px] border-slate-800 shadow-2xl overflow-hidden w-[280px] aspect-9/16 mx-auto sticky top-24">
      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
        alt="TikTok Preview"
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/60" />

      {/* Right Side Actions (Icons) */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-white">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-slate-700/50 backdrop-blur-md flex items-center justify-center border border-white/20">
            <ThumbsUp className="h-5 w-5 fill-white" />
          </div>
          <span className="text-[10px] mt-1 font-bold">12.5k</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-slate-700/50 backdrop-blur-md flex items-center justify-center border border-white/20">
            <MessageCircle className="h-5 w-5 fill-white" />
          </div>
          <span className="text-[10px] mt-1 font-bold">458</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-slate-700/50 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Share2 className="h-5 w-5 fill-white" />
          </div>
          <span className="text-[10px] mt-1 font-bold">2.1k</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-6 left-4 right-14 text-white">
        <div className="font-bold text-[14px] mb-1 flex items-center gap-1">
          @vcconnect.asset{" "}
          <Badge className="bg-blue-400 h-3 w-3 p-0 rounded-full border-0" />
        </div>
        <div className="text-[12px] leading-tight line-clamp-3 mb-2 drop-shadow-md">
          {renderContent(template)}
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium py-1 px-2 bg-white/10 backdrop-blur-md rounded-full w-fit">
          <Sparkles className="h-3 w-3 text-amber-400" />
          #Property #RealEstate
        </div>
      </div>

      {/* Music Disk */}
      <div className="absolute bottom-6 right-3">
        <div className="w-9 h-9 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center animate-spin-slow">
          <div className="w-4 h-4 rounded-full bg-slate-600" />
        </div>
      </div>
    </div>
  );
}
