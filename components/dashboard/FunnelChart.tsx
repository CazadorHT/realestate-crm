"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FUNNEL_STATS } from "@/lib/dashboard-data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

export function FunnelChart() {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base">Sales Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full flex">
          <ResponsiveContainer width="70%" height="100%">
            <BarChart 
              data={FUNNEL_STATS} 
              layout="vertical" 
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis 
                dataKey="step" 
                type="category" 
                width={80}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <Tooltip 
                cursor={{ fill: "transparent" }}
                formatter={(value: number) => [value, "Count"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                {FUNNEL_STATS.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Drop-off Stats */}
          <div className="w-[30%] flex flex-col justify-center space-y-4 pr-2">
             {FUNNEL_STATS.map((step, index) => {
                if (index === 0) return null;
                const prev = FUNNEL_STATS[index - 1];
                const drop = prev.count - step.count;
                const dropRate = Math.round((drop / prev.count) * 100);
                
                return (
                  <div key={step.step} className="text-[10px] text-muted-foreground flex flex-col items-end">
                     <span className="font-semibold text-red-500">-{dropRate}%</span>
                     <span className="opacity-70">↓ {step.step}</span>
                  </div>
                );
             })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
