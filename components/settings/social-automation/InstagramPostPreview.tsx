import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MOCK_PROPERTY_DATA } from "./constants";

export function InstagramPostPreview({
  template,
  language = "th",
}: {
  template: string;
  language?: "th" | "en" | "cn";
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
    <div className="bg-white border rounded-xl border-slate-200 shadow-sm overflow-hidden max-w-[350px] mx-auto sticky top-24">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-amber-500 via-pink-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white p-[2px]">
               <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold">VC</div>
            </div>
          </div>
          <div className="text-[13px] font-semibold">vcconnect.asset</div>
        </div>
        <MoreHorizontal className="h-4 w-4 text-slate-500" />
      </div>

      {/* Media */}
      <div className="aspect-square bg-slate-100 relative group overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
          alt="Mock Property"
          className="w-full h-full object-cover"
        />
         <div className="absolute top-3 right-3">
              <Badge className="bg-black/50 text-white border-0 backdrop-blur-md text-[10px] font-semibold">1/10 (API Limit)</Badge>
         </div>
      </div>

      {/* Actions */}
      <div className="p-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heart className="h-6 w-6 text-slate-700 hover:text-red-500 cursor-pointer" />
          <MessageCircle className="h-6 w-6 text-slate-700" />
          <Send className="h-6 w-6 text-slate-700" />
        </div>
        <Bookmark className="h-6 w-6 text-slate-700" />
      </div>

      {/* Likes */}
      <div className="px-3 text-[13px] font-semibold text-slate-900 mb-1">
        432 likes
      </div>

      {/* Caption */}
      <div className="px-3 pb-4 text-[13.5px] leading-snug text-slate-900">
        <span className="font-semibold mr-2">vcconnect.asset</span>
        <div className="inline whitespace-pre-wrap">
           {renderContent(template)}
        </div>
        <div className="text-slate-500 text-[12px] mt-2 font-medium">
          View all 12 comments
        </div>
        <div className="text-slate-400 text-[10px] mt-1 uppercase tracking-tighter">
          2 hours ago
        </div>
      </div>
    </div>
  );
}
