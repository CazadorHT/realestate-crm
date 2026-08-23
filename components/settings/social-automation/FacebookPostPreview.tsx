import { Globe, ChevronDown, ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMockPropertyData } from "./constants";
import { type Language } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";
import { useLanguage } from "@/lib/i18n/language-context";

export function FacebookPostPreview({
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

    return rendered.split("\n").map((line, i) => (
      <span key={i} className="block min-h-[1em]">
        {line}
      </span>
    ));
  };

  const initials = siteConfig.name
    ? siteConfig.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "VC";

  return (
    <div className="bg-white border rounded-2xl border-slate-200 shadow-sm overflow-hidden max-w-md mx-auto sticky top-24">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-[15px] flex items-center gap-1">
              {siteConfig.name}
              <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">✓</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-slate-500">
              Just now · <Globe className="h-3 w-3" />
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap font-normal">
        {renderContent(template)}
      </div>

      {/* Media Placeholder */}
      <div className="aspect-video bg-slate-100 relative group overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
          alt="Mock Property"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          <Badge className="bg-white/90 text-slate-900 border-0 shadow-sm backdrop-blur-xs font-bold text-[9px] px-2 py-0.5 rounded-md">
            {mockData.listing_type === "Sale"
              ? "FOR SALE"
              : "FOR RENT"}
          </Badge>
          <Badge className="bg-blue-600/90 text-white border-0 shadow-sm backdrop-blur-xs font-bold text-[9px] px-2 py-0.5 rounded-md">
            {mockData.price}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-200 text-[11px] text-slate-550 font-medium tracking-tight">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-4.5 h-4.5 rounded-full bg-blue-500 flex items-center justify-center border border-white">
              <ThumbsUp className="h-2.5 w-2.5 text-white fill-current" />
            </div>
          </div>
          42
        </div>
        <div className="flex gap-2">
          <span>8 comments</span>
          <span>5 shares</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-0.5 flex justify-between text-slate-500 font-semibold text-[12px]">
        <Button
          variant="ghost"
          className="flex-1 gap-1.5 hover:bg-slate-100 p-0 h-9 font-semibold text-[12px]"
        >
          <ThumbsUp className="h-4 w-4" /> Like
        </Button>
        <Button
          variant="ghost"
          className="flex-1 gap-1.5 hover:bg-slate-100 p-0 h-9 font-semibold text-[12px]"
        >
          <MessageCircle className="h-4 w-4" /> Comment
        </Button>
        <Button
          variant="ghost"
          className="flex-1 gap-1.5 hover:bg-slate-100 p-0 h-9 font-semibold text-[12px]"
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  );
}
