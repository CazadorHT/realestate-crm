"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PropertyCardFeatures({
  features,
}: {
  features: { id: string; name: string; icon_key: string }[] | null | undefined;
}) {
  if (!features || features.length === 0) return null;

  return (
    <div className="hidden sm:flex flex-wrap gap-1 mt-2 h-6 overflow-hidden">
      {features.slice(0, 3).map((f) => (
        <span
          key={f.id}
          className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 group-hover:bg-slate-100 duration-300 group-hover:text-slate-700"
        >
          {f.name}
        </span>
      ))}
      {features.length > 3 && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md cursor-help hover:bg-slate-100 transition-colors group-hover:text-slate-600">
                +{features.length - 3}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-slate-900/95 backdrop-blur-sm text-slate-50 border-slate-800 p-3 shadow-xl z-50"
            >
              <div className="font-semibold text-[10px] mb-1.5 text-slate-400 uppercase tracking-wider">
                เพิ่มเติม
              </div>
              <ul className="text-xs space-y-1 min-w-[120px]">
                {features.slice(3, 8).map((f) => (
                  <li key={f.id} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0"></div>
                    <span className="truncate max-w-[150px]">{f.name}</span>
                  </li>
                ))}
                {features.length > 8 && (
                  <li className="text-slate-500 pl-3 text-[10px]">
                    ...และอีก {features.length - 8} รายการ
                  </li>
                )}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
