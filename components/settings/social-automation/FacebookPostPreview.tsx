import { Globe, ChevronDown, ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_PROPERTY_DATA } from "./constants";

import { type Language } from "@/lib/i18n";

export function FacebookPostPreview({
  template,
  language = "th",
}: {
  template: string;
  language?: Language;
}) {
  const renderContent = (text: string) => {
    if (!text)
      return (
        <span className="text-slate-300 italic">
          กรุณากรอกรูปแบบข้อความเพื่อดูตัวอย่าง...
        </span>
      );

    let rendered = text;
    Object.entries(MOCK_PROPERTY_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(regex, value || "");
    });

    return rendered.split("\n").map((line, i) => (
      <span key={i} className="block min-h-[1em]">
        {line}
      </span>
    ));
  };

  return (
    <div className="bg-white border rounded-2xl border-slate-200 shadow-sm overflow-hidden max-w-md mx-auto sticky top-24 italic">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            VC
          </div>
          <div>
            <div className="font-semibold text-[15px] flex items-center gap-1">
              VC Connect Asset
              <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                <Badge className="h-2 w-2 p-0 border-0 bg-white" />
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
      <div className="px-4 pb-3 text-[15px] leading-relaxed text-slate-900 whitespace-pre-wrap font-medium">
        {renderContent(template)}
      </div>

      {/* Media Placeholder */}
      <div className="aspect-video bg-slate-100 relative group overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
          alt="Mock Property"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-white/90 text-slate-900 border-0 shadow-sm backdrop-blur-xs font-semibold">
            {MOCK_PROPERTY_DATA.listing_type === "Sale"
              ? "FOR SALE"
              : "FOR RENT"}
          </Badge>
          <Badge className="bg-blue-600/90 text-white border-0 shadow-sm backdrop-blur-xs font-semibold">
            {MOCK_PROPERTY_DATA.price}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 text-[13px] text-slate-500 font-semibold tracking-tight">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white">
              <ThumbsUp className="h-2.5 w-2.5 text-white fill-current" />
            </div>
          </div>
          42
        </div>
        <div className="flex gap-3">
          <span>8 comments</span>
          <span>5 shares</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex justify-between text-slate-500 font-semibold text-[14px]">
        <Button
          variant="ghost"
          className="flex-1 gap-2 hover:bg-slate-100 p-0 h-10 font-semibold"
        >
          <ThumbsUp className="h-5 w-5" /> Like
        </Button>
        <Button
          variant="ghost"
          className="flex-1 gap-2 hover:bg-slate-100 p-0 h-10 font-semibold"
        >
          <MessageCircle className="h-5 w-5" /> Comment
        </Button>
        <Button
          variant="ghost"
          className="flex-1 gap-2 hover:bg-slate-100 p-0 h-10 font-semibold"
        >
          <Share2 className="h-5 w-5" /> Share
        </Button>
      </div>
    </div>
  );
}
