import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineData } from "@/features/dashboard/queries";

interface PipelineSummaryProps {
  data: PipelineData[];
}

export function PipelineSummary({ data = [] }: PipelineSummaryProps) {
  if (!data) return null;
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="shadow-lg border-none bg-white dark:bg-slate-900 overflow-hidden h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            ภาพรวม Pipeline
          </CardTitle>
          <div className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
            TOTAL: {total}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {data.map((stage) => {
            const percentage =
              total > 0 ? Math.round((stage.count / total) * 100) : 0;

            // Extract the color class and map to a more premium gradient if possible,
            // or just use it with better shadow/rounding.
            const bgClass = stage.color.includes("bg-")
              ? stage.color
              : `bg-${stage.color}`;

            return (
              <div key={stage.stage} className="space-y-2 group cursor-default">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {stage.stage}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {stage.count}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      รายการ
                    </span>
                  </div>
                </div>

                <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-full ${bgClass} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.05)] transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                  {/* Subtle shine effect on the progress bar */}
                  <div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent w-2/3 -skew-x-12 opacity-50"
                    style={{ left: `${Math.max(0, percentage - 20)}%` }}
                  />
                </div>

                <div className="flex justify-end">
                  <span className="text-[10px] font-bold text-slate-400">
                    {percentage}% ของทั้งหมด
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
