"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REVENUE_CHART_DATA } from "@/lib/dashboard-data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export function RevenueChart() {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-base">รายได้รวม 6 เดือนล่าสุด</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={REVENUE_CHART_DATA}>
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `฿${value / 1000}k`}
              />
              <Tooltip 
                cursor={{ fill: "transparent" }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value: number) => [`฿${value.toLocaleString()}`, "Revenue"]}
              />
              <Bar 
                dataKey="total" 
                fill="currentColor" 
                radius={[4, 4, 0, 0]} 
                className="fill-primary" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
