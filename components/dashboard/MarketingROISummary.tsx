"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MarketingPerformanceData } from "@/features/dashboard/queries";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Zap } from "lucide-react";

interface MarketingROISummaryProps {
  data: MarketingPerformanceData[];
}

export function MarketingROISummary({ data }: MarketingROISummaryProps) {
  return (
    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Marketing ROI Insights
          </CardTitle>
          <CardDescription>
            ประสิทธิภาพของช่องทางต่างๆ วัดตามคุณภาพลีด (AI Score)
          </CardDescription>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic">
              ยังไม่มีข้อมูล Marketing Attribution
            </div>
          ) : (
            data.map((item) => (
              <div
                key={item.source}
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:shadow-lg hover:border-blue-200"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {item.source}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{item.leadCount} ลีด</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-orange-600 font-medium">🔥 {item.hotLeadCount} Hot Leads</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-1">Avg. AI Score</div>
                    <Badge 
                      variant="secondary" 
                      className={`
                        text-sm font-bold rounded-lg px-2.5 py-0.5
                        ${item.avgAiScore >= 70 ? 'bg-green-100 text-green-700' : 
                          item.avgAiScore >= 40 ? 'bg-orange-100 text-orange-700' : 
                          'bg-slate-100 text-slate-700'}
                      `}
                    >
                      {item.avgAiScore}
                    </Badge>
                  </div>
                </div>
                
                {/* Progress Bar for Score */}
                <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 group-hover:opacity-80
                      ${item.avgAiScore >= 70 ? 'bg-green-500' : 
                        item.avgAiScore >= 40 ? 'bg-orange-500' : 
                        'bg-slate-400'}
                    `}
                    style={{ width: `${item.avgAiScore}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        
        {data.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-md">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Tip:</strong> ช่องทางที่มีค่าเฉลี่ย AI Score สูง คือช่องทางที่สร้างกลุ่มเป้าหมายที่มีคุณภาพ (Intent สูง) 
              คุณควรพิจารณาเพิ่มงบโฆษณาในช่องทางที่มี Hot Leads หนาแน่นที่สุด
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
