"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Eye, TrendingUp, Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";

interface AnalyticsOverviewProps {
  totalViews: number;
  topAreas: any[];
  topProperties: any[];
  days?: number;
}

export function AnalyticsOverview({ totalViews, topAreas, topProperties, days }: AnalyticsOverviewProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <Card className="border-none shadow-sm bg-linear-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 transition-transform group-hover:scale-110 duration-500">
           <Eye className="h-32 w-32" />
        </div>
        <CardHeader className="pb-2 relative z-10">
          <CardDescription className="text-blue-100 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {isEn ? "Total Page Views" : "ยอดเข้าชมทั้งหมด"}
          </CardDescription>
          <CardTitle className="text-3xl md:text-4xl font-semibold text-white">
            {totalViews.toLocaleString()} <span className="text-blue-50 text-xs font-normal tracking-normal uppercase">{isEn ? "Views" : "Views"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <p className="text-[10px] text-blue-100/80 uppercase tracking-widest font-bold">
            {isEn 
              ? `Real-time updates • ${days ? `Past ${days} Days` : "All-time"}`
              : `อัปเดตแบบ Real-time • ${days ? `ย้อนหลัง ${days} วัน` : "ทั้งหมด"}`}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white overflow-hidden group">
        <CardHeader className="pb-2">
          <CardDescription className="text-slate-500 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            {isEn ? "Most Popular Area" : "ย่านยอดนิยม"}
          </CardDescription>
          <CardTitle className="text-xl md:text-2xl font-medium truncate text-slate-900 group-hover:text-blue-600 transition-colors">
            {topAreas[0]?.name || (isEn ? "No data" : "ไม่มีข้อมูล")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400 font-medium">
            {topAreas[0]?.view_count
              ? `${topAreas[0].view_count.toLocaleString()} Views ${isEn ? "(Top Search Volume)" : "(+ยอดการค้นหาสูงสุด)"}`
              : "-"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white sm:col-span-2 lg:col-span-1 group">
        <CardHeader className="pb-2">
          <CardDescription className="text-slate-500 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-orange-500" />
            {isEn ? "Most Viewed Property" : "ทรัพย์ที่ถูกเปิดดูมากที่สุด"}
          </CardDescription>
          <CardTitle className="text-lg md:text-xl font-medium line-clamp-1 text-slate-900 group-hover:text-blue-600 transition-colors">
            {topProperties[0]?.title || (isEn ? "No data" : "ไม่มีข้อมูล")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400 font-medium">
            {topProperties[0]?.view_count
              ? `${topProperties[0].view_count.toLocaleString()} Views ${isEn ? "(Trending listing)" : "(ดีลที่กำลังเป็นกระแส)"}`
              : "-"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

