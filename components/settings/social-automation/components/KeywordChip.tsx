import { ArrowDown, AlertCircle } from "lucide-react";
import { SocialKeyword } from "@/features/site-settings/schema";

interface KeywordChipProps {
  index: number;
  item: SocialKeyword;
  error: boolean;
  onClick: (index: number) => void;
}

export function KeywordChip({ index, item, error, onClick }: KeywordChipProps) {
  const isEnabled = item.enabled !== false;
  
  return (
    <button
      onClick={() => onClick(index)}
      className={`group relative flex items-center gap-2 px-4 py-2 bg-white border rounded-2xl transition-all duration-300 shadow-sm ${
        !isEnabled 
          ? "opacity-60 grayscale border-slate-200 hover:grayscale-0 hover:opacity-100" 
          : error 
            ? "border-red-200 ring-2 ring-red-50 hover:border-red-400 hover:ring-red-100" 
            : "border-slate-200 hover:border-blue-500 hover:ring-4 hover:ring-blue-50"
      }`}
    >
      <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] ${!isEnabled ? "bg-slate-300" : error ? "bg-red-500" : "bg-blue-500"}`} />
      <span className={`text-[15px] font-semibold ${!isEnabled ? "text-slate-400" : error ? "text-red-700" : "text-slate-700 group-hover:text-blue-600"}`}>
        {item.keyword || "ยังไม่ได้ตั้งค่า"}
      </span>
      {error ? (
        <AlertCircle className="h-3.5 w-3.5 text-red-500 animate-pulse" />
      ) : (
        <ArrowDown className="h-3 w-3 text-slate-300 group-hover:text-blue-400 rotate-[-135deg]" />
      )}
    </button>
  );
}
