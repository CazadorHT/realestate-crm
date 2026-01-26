import React from "react";

export function SectionHeader({
  icon: Icon,
  title,
  desc,
  tone = "default",
  right,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  tone?: "default" | "blue" | "purple" | "emerald";
  right?: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    default: "text-slate-700 bg-slate-100",
    blue: "text-blue-700 bg-blue-100",
    purple: "text-purple-700 bg-purple-100",
    emerald: "text-emerald-700 bg-emerald-100",
  };

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start  gap-3">
        <div className={`mt-0.5 rounded-xl p-2 ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <div className="flex flex-col">
            <h3 className="text-base font-medium tracking-tight text-slate-900">
              {title}
            </h3>
            {desc ? (
              <span className="hidden sm:inline text-xs font-light text-slate-500">
                {desc}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {right ? <div className="pt-0.5">{right}</div> : null}
    </div>
  );
}
