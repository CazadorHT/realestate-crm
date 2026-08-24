"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AreaAnalytics, DistributionData } from "@/features/dashboard/queries";
import { TrendingUp, MapPin, Building2, CheckCircle2 } from "lucide-react";
import { listingTypeLabel, propertyTypeLabel, ListingType, PropertyType } from "@/features/properties/labels";
import { useLanguage } from "@/lib/i18n/language-context";
import { getDistrictName, getProvinceName } from "@/lib/utils/provinces";

interface QuickInsightsProps {
  topAreas: AreaAnalytics[];
  listingTypeDist: DistributionData[];
  propertyTypeDist: DistributionData[];
  totalViews: number;
}

export function QuickInsights({ topAreas, listingTypeDist, propertyTypeDist, totalViews }: QuickInsightsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const topArea = topAreas[0];
  const topListingType = listingTypeDist[0];
  const topPropertyType = propertyTypeDist[0];

  const topAreaName = topArea
    ? (isEn ? (getDistrictName(topArea.name, "en") || getProvinceName(topArea.name, "en") || topArea.name) : topArea.name)
    : (isEn ? "No data" : "ไม่มีข้อมูล");

  const insights = [
    {
      title: isEn ? "Top #1 Area" : "ย่านยอดนิยมอันดับ 1",
      value: topAreaName,
      detail: topArea ? `${topArea.view_count.toLocaleString()} Views` : "-",
      icon: MapPin,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: isEn ? "Most Demanded Deal Type" : "ประเภทดีลที่ถูกหามากที่สุด",
      value: topListingType ? listingTypeLabel(topListingType.label as ListingType, isEn ? "en" : "th") : (isEn ? "No data" : "ไม่มีข้อมูล"),
      detail: topListingType ? `${Math.round((topListingType.value / (totalViews || 1)) * 100)}% ${isEn ? "of total views" : "ของยอดวิวทั้งหมด"}` : "-",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: isEn ? "Most Popular Property Type" : "ประเภททรัพย์ยอดนิยม",
      value: topPropertyType ? propertyTypeLabel(topPropertyType.label as PropertyType, isEn ? "en" : "th") : (isEn ? "No data" : "ไม่มีข้อมูล"),
      detail: topPropertyType ? `${topPropertyType.value.toLocaleString()} Views` : "-",
      icon: Building2,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {insights.map((insight) => (
        <Card key={insight.title} className="border-none shadow-soft overflow-hidden bg-white hover:scale-[1.02] transition-transform duration-300">
          <CardContent className="p-5 flex items-start gap-4">
            <div className={`p-2.5 rounded-xl ${insight.bg} ${insight.color} shrink-0`}>
              <insight.icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                 {insight.title}
               </span>
               <span className="text-sm font-bold text-slate-900 truncate">
                 {insight.value}
               </span>
               <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                 <CheckCircle2 className="h-3 w-3 text-slate-300" />
                 {insight.detail}
               </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

