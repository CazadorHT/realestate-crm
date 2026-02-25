import { Sparkles } from "lucide-react";

export function SmartSummary({ text }: { text?: string }) {
  return (
    <div className="bg-linear-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4 flex items-start gap-3 shadow-sm">
      <div className="bg-white p-2 rounded-full shadow-sm mt-0.5">
        <Sparkles className="h-4 w-4 text-indigo-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-indigo-900">
          Daily Insight
        </h3>
        <p className="text-sm text-indigo-800/80 mt-1">
          {text || "กำลังรวบรวมข้อมูล..."}
        </p>
      </div>
    </div>
  );
}
