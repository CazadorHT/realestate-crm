"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaAnalytics } from "@/features/dashboard/queries";
import { cn } from "@/lib/utils";
import { MapPin, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { translateLocation } from "@/lib/utils/provinces";

interface AreaHeatmapProps {
  data: AreaAnalytics[];
}

export function AreaHeatmap({ data }: AreaHeatmapProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const maxViews = Math.max(...data.map(d => d.view_count), 1);
  
  return (
    <Card className="border-none shadow-soft bg-white/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
           <MapPin className="h-5 w-5 text-blue-500" />
           <CardTitle className="text-lg font-semibold text-slate-800">
             {isEn ? "Area Heatmap & Density" : "แผนภาพความหนาแน่นรายพื้นที่"}
           </CardTitle>
        </div>
        <CardDescription>
          {isEn ? "Visual geographic popularity distribution" : "วิเคราะห์ความนิยมรายย่านด้วยความร้อนของข้อมูลสถิติ"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {data.map((area) => {
            const intensity = area.view_count / maxViews;
            const displayName = translateLocation(area.name, isEn ? "en" : "th") || area.name;
            
            return (
              <div 
                key={area.name}
                className={cn(
                  "relative p-4 rounded-2xl border transition-all hover:scale-105 group cursor-default overflow-hidden",
                  intensity > 0.8 ? "bg-blue-600 border-blue-400 text-white" :
                  intensity > 0.5 ? "bg-blue-100 border-blue-200 text-blue-900" :
                  intensity > 0.2 ? "bg-blue-50 border-blue-100 text-blue-800" :
                  "bg-slate-50 border-slate-100 text-slate-600"
                )}
              >
                {/* Background Decoration */}
                <div className="absolute -right-2 -bottom-2 opacity-10 group-hover:scale-150 transition-transform duration-500">
                   <TrendingUp className="h-12 w-12" />
                </div>

                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1 line-clamp-1">{displayName}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">{area.view_count.toLocaleString()}</span>
                    <span className="text-[10px] font-medium opacity-70">VIEWS</span>
                  </div>
                  
                  <div className="mt-3 h-1 w-full bg-black/5 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        intensity > 0.8 ? "bg-white" : "bg-blue-500"
                      )}
                      style={{ width: `${intensity * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          
          {data.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 italic">
              {isEn ? "— No area analytics recorded at this time —" : "— ยังไม่มีข้อมูลย่านยอดนิยมในขณะนี้ —"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

