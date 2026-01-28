import { Sparkles } from "lucide-react";

export function SmartSummary({ text }: { text?: string }) {
  return (
    <div className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900 rounded-lg p-4 flex items-start gap-3 shadow-sm">
      <div className="bg-white dark:bg-indigo-900 p-2 rounded-full shadow-sm mt-0.5">
        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
          Daily Insight
        </h3>
        <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80 mt-1">
          {text || "กำลังรวบรวมข้อมูล..."}
        </p>
      </div>
    </div>
  );
}
