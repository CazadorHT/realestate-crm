"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { FunnelData } from "@/features/dashboard/queries";

interface FunnelChartProps {
  data: FunnelData[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base">ช่องทางการขาย (Funnel)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.every((d) => d.count === 0) ? (
          <div className="h-[250px] w-full flex items-center justify-center text-sm text-muted-foreground bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            ไม่มีข้อมูลการขายในขณะนี้
          </div>
        ) : (
          <div className="h-[250px] w-full flex gap-2">
            <div className="flex-1 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="step"
                    type="category"
                    width={80}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.02)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: any) => [
                      <span className="font-bold">{value} รายการ</span>,
                      "จำนวน",
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Drop-off Stats */}
            <div className="w-[85px] shrink-0 flex flex-col justify-center space-y-4 pr-1 border-l border-slate-100 pl-2">
              {data.map((step, index) => {
                if (index === 0) return null;
                const prev = data[index - 1];
                const drop = prev.count - step.count;
                const dropRate =
                  prev.count > 0 ? Math.round((drop / prev.count) * 100) : 0;

                if (dropRate <= 0)
                  return <div key={step.step} className="h-8" />;

                return (
                  <div
                    key={step.step}
                    className="text-[9px] text-muted-foreground flex flex-col items-end py-1"
                  >
                    <span className="font-bold text-rose-500 bg-rose-50 px-1 rounded">
                      -{dropRate}%
                    </span>
                    <span className="opacity-60 text-[8px] truncate max-w-full">
                      ↓ {step.step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
